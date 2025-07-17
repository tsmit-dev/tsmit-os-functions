
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios, {isAxiosError} from "axios";

// Inicializa o Firebase Admin SDK para que as funções possam atuar com
// privilégios de administrador.
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * Checks if the calling user has the 'adminUsers' permission.
 * @param {string} uid - The UID of the user calling the function.
 */
async function requireAdminUsersPermission(uid: string) {
  const callingUserDoc = await db.collection("users").doc(uid).get();
  if (!callingUserDoc.exists) {
    throw new HttpsError(
      "not-found",
      "O usuário chamador não foi encontrado.",
    );
  }
  const callingUserData = callingUserDoc.data();
  if (!callingUserData?.roleId) {
    throw new HttpsError(
      "permission-denied",
      "O usuário chamador não possui um cargo definido.",
    );
  }

  const roleDoc = await db
    .collection("roles")
    .doc(callingUserData.roleId)
    .get();
  const roleData = roleDoc.data();

  if (!roleDoc.exists || !roleData?.permissions?.adminUsers) {
    const email = callingUserData?.email || "N/A";
    const errorMessage =
      `Usuário ${uid} (${email}) tentou executar uma operação de ` +
      "admin sem a devida permissão.";
    logger.error(errorMessage);
    throw new HttpsError(
      "permission-denied",
      "Você não tem permissão para gerenciar usuários.",
    );
  }
}

/**
 * Cria um novo usuário no sistema.
 */
export const createUser = onCall(async (request) => {
  logger.info("Iniciando a criação de usuário...", {structuredData: true});

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  const uid = request.auth.uid;
  await requireAdminUsersPermission(uid);

  const {email, password, name, roleId} = request.data;
  if (!email || !password || !name || !roleId) {
    throw new HttpsError("invalid-argument", "Dados incompletos.");
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });
    logger.info(`Usuário criado na autenticação com UID: ${userRecord.uid}`);

    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      roleId,
    });
    logger.info(`Documento do usuário criado no Firestore: ${userRecord.uid}`);

    return {status: "success", uid: userRecord.uid};
  } catch (error) {
    logger.error("Erro inesperado ao criar usuário:", error);
    throw new HttpsError("internal", "Erro interno ao criar o usuário.");
  }
});

/**
 * Atualiza um usuário existente.
 */
export const updateUser = onCall(async (request) => {
  logger.info("Iniciando a atualização de usuário...", {structuredData: true});

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  const callingUid = request.auth.uid;
  await requireAdminUsersPermission(callingUid);

  const {uid: targetUid, data} = request.data;
  if (!targetUid || !data) {
    throw new HttpsError(
      "invalid-argument",
      "UID do usuário e dados são obrigatórios.",
    );
  }

  try {
    const authUpdatePayload: {
      email?: string;
      displayName?: string;
      password?: string;
    } = {};
    if (data.email) authUpdatePayload.email = data.email;
    if (data.name) authUpdatePayload.displayName = data.name;
    if (data.password) authUpdatePayload.password = data.password;

    if (Object.keys(authUpdatePayload).length > 0) {
      await auth.updateUser(targetUid, authUpdatePayload);
      logger.info(`Usuário ${targetUid} atualizado na autenticação.`);
    }

    await db.collection("users").doc(targetUid).update(data);
    logger.info(`Documento do usuário ${targetUid} atualizado no Firestore.`);

    return {status: "success", message: "Usuário atualizado com sucesso!"};
  } catch (error) {
    logger.error(`Erro ao atualizar usuário ${targetUid}:`, error);
    throw new HttpsError("internal", "Erro interno ao atualizar o usuário.");
  }
});

/**
 * Exclui um usuário.
 */
export const deleteUser = onCall(async (request) => {
  logger.info("Iniciando a exclusão de usuário...", {structuredData: true});

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  const callingUid = request.auth.uid;
  await requireAdminUsersPermission(callingUid);

  const {uid: targetUid} = request.data;
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "UID do usuário é obrigatório.");
  }
  if (callingUid === targetUid) {
    throw new HttpsError("permission-denied", "Você não pode se autoexcluir.");
  }

  try {
    await auth.deleteUser(targetUid);
    logger.info(`Usuário ${targetUid} excluído da autenticação.`);

    await db.collection("users").doc(targetUid).delete();
    logger.info(`Documento do usuário ${targetUid} excluído do Firestore.`);

    return {status: "success", message: "Usuário excluído com sucesso!"};
  } catch (error) {
    logger.error(`Erro ao excluir usuário ${targetUid}:`, error);
    throw new HttpsError("internal", "Erro interno ao excluir o usuário.");
  }
});

export const sendWhatsappMessage = onCall(async (request) => {
  logger.info("Iniciando o envio de mensagem do WhatsApp via n8n...", {
    structuredData: true,
  });

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }

  const {
    number,
    body: messageBody,
  } = request.data;

  if (!number || !messageBody) {
    throw new HttpsError(
      "invalid-argument",
      "Os campos 'number' e 'body' são obrigatórios.",
    );
  }

  try {
    const settingsDoc = await db.collection("settings").doc("whatsapp").get();

    if (!settingsDoc.exists) {
      throw new HttpsError(
        "failed-precondition",
        "Configurações de integração do n8n não encontradas no Firestore.",
      );
    }

    const settings = settingsDoc.data();
    logger.info("Configurações do n8n recuperadas:", {settings});

    const n8nWebhookUrl = settings?.n8nWebhookUrl;
    const n8nBearerToken = settings?.n8nBearerToken;

    if (!n8nWebhookUrl) {
      logger.error("A URL do webhook n8n não está configurada.", {settings});
      throw new HttpsError(
        "failed-precondition",
        "A URL do webhook n8n não está configurada.",
      );
    }

    const headers: {[key: string]: string} = {
      "Content-Type": "application/json",
    };

    if (n8nBearerToken) {
      headers["Authorization"] = `Bearer ${n8nBearerToken}`;
    }

    const bodyPayload = {
      number,
      message: messageBody,
    };

    logger.info("Enviando requisição para o webhook do n8n...", {
      url: n8nWebhookUrl,
      body: bodyPayload,
    });

    const apiResponse = await axios.post(n8nWebhookUrl, bodyPayload, {headers});

    logger.info("Resposta recebida do n8n.", {
      status: apiResponse.status,
      data: apiResponse.data,
    });

    return apiResponse.data;
  } catch (error) {
    logger.error("Erro ao processar o envio da mensagem para o n8n:", error);

    if (isAxiosError(error)) {
      logger.error("Erro específico do Axios:", {
        message: error.message,
        url: error.config?.url,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new HttpsError(
        "internal",
        "Falha na comunicação com o webhook do n8n.",
        error.response?.data
      );
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Ocorreu um erro interno ao enviar a mensagem para o n8n.",
    );
  }
});
