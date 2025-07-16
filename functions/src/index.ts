
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Inicializa o Firebase Admin SDK para que as funções possam atuar com
// privilégios de administrador.
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * Cria um novo usuário no sistema.
 * Esta função só pode ser executada por um usuário autenticado com a
 * função de 'admin'.
 * @param {object} data - { email: string, password, string, name: string,
 * roleId: string }
 * @param {object} context - Informações de autenticação do usuário que está
 * chamando a função.
 */
export const createUser = onCall(async (request) => {
  logger.info("Iniciando a criação de usuário...", {structuredData: true});

  // 1. Verificação de Autenticação
  if (!request.auth) {
    logger.warn("Tentativa de criação de usuário não autenticada.");
    throw new HttpsError(
      "unauthenticated",
      "Você precisa estar autenticado para realizar esta operação.",
    );
  }

  const uid = request.auth.uid;
  const {email, password, name, roleId} = request.data;

  // Validação básica dos dados de entrada
  if (!email || !password || !name || !roleId) {
    throw new HttpsError(
      "invalid-argument",
      "Dados incompletos. E-mail, senha, nome e função são obrigatórios.",
    );
  }

  try {
    // 2. Verificação de Permissão
    const callingUserDoc = await db.collection("users").doc(uid).get();
    if (!callingUserDoc.exists) {
      throw new HttpsError(
        "not-found",
        "O usuário que está realizando a chamada não foi encontrado.",
      );
    }
    const callingUserData = callingUserDoc.data();
    const roleDoc = await db.collection("roles").doc(callingUserData?.roleId)
      .get();

    if (!roleDoc.exists || roleDoc.data()?.name !== "admin") {
      logger.error(
        `Usuário ${uid} (${callingUserData?.email}) tentou criar um ` +
          "usuário sem permissão de admin.",
      );
      throw new HttpsError(
        "permission-denied",
        "Você não tem permissão para criar novos usuários.",
      );
    }

    logger.info(`Permissão de admin confirmada para o usuário ${uid}.`);

    // 3. Criação do Usuário na Autenticação
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    logger.info(`Usuário criado na autenticação com UID: ${userRecord.uid}`);

    // 4. Criação do Documento no Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      roleId: roleId,
    });

    logger.info(`Documento do usuário criado no Firestore: ${userRecord.uid}`);

    return {
      status: "success",
      message: "Usuário criado com sucesso!",
      uid: userRecord.uid,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error; // Re-lança os erros HttpsError que já foram tratados.
    }
    logger.error("Erro inesperado ao criar usuário:", error);
    // Para outros tipos de erro, lança um erro genérico.
    throw new HttpsError(
      "internal",
      "Ocorreu um erro interno ao criar o usuário.",
    );
  }
});
