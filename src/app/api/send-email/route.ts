import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { ServiceOrder, Client, EmailSettings } from '@/lib/types';
import { db } from '@/lib/firebaseAdmin';

// Initialize MailerSend with your API token from environment variables
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

async function sendEmailWithMailerSend(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  htmlContent: string,
  senderEmail: string
) {
  const sentFrom = new Sender(senderEmail, "TSMIT - Suporte");
  const recipients = [new Recipient(recipientEmail, recipientName)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(htmlContent);

  try {
    await mailerSend.email.send(emailParams);
  } catch (error) {
    console.error('Error sending email via MailerSend:', error);
    if (error instanceof Error && 'body' in error) {
      console.error('MailerSend Error Body:', (error as any).body);
    }
    throw new Error('Failed to send email via MailerSend.');
  }
}

function generateDynamicEmailContent(
    order: ServiceOrder, 
    clientName: string, 
    emailSubjectTpl: string | undefined, 
    emailBodyTpl: string
): { subject: string, htmlContent: string } {
    
    // Fallback subject if no template is provided in the status
    const subjectTemplate = emailSubjectTpl || `Atualização da OS {{osNumber}} - Status: {{statusName}}`;
    
    // Define the replacements based on the variables shown in the frontend
    const replacements: { [key: string]: string } = {
        "{{clientName}}": clientName,
        "{{osNumber}}": order.orderNumber,
        "{{equipment}}": `${order.equipment.type} ${order.equipment.brand} ${order.equipment.model}`,
        "{{statusName}}": order.status.name,
        "{{entryDate}}": order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A',
        "{{pickupDate}}": order.status.isPickupStatus ? new Date().toLocaleDateString('pt-BR') : 'N/A', // Assumes email is sent on pickup day
        "{{technicalSolution}}": order.technicalSolution || 'Nenhuma solução técnica detalhada foi fornecida.'
    };

    // Function to replace all placeholders in a given template string
    const replacePlaceholders = (template: string): string => {
        let result = template;
        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(key.replace(/[-\/\^$*+?.()|[\]{}]/g, '\$&'), 'g');
            result = result.replace(regex, value);
        }
        return result;
    }

    const personalizedSubject = replacePlaceholders(subjectTemplate);
    const personalizedBody = replacePlaceholders(emailBodyTpl).replace(/
/g, '<br>');

    const commonStyle = "font-family: Arial, sans-serif; line-height: 1.6; color: #333;";
    const headerStyle = "color: #0056b3;";
    const footerStyle = "font-size: 0.8em; color: #777;";

    const htmlContent = `
        <div style="${commonStyle}">
            <h2 style="${headerStyle}">${personalizedSubject}</h2>
            <p>Prezado(a) ${clientName},</p>
            <div>${personalizedBody}</div>
            <p><strong>Resumo do Equipamento:</strong></p>
            <ul>
                <li><strong>Número da OS:</strong> ${order.orderNumber}</li>
                <li><strong>Equipamento:</strong> ${order.equipment.type} - ${order.equipment.brand} ${order.equipment.model}</li>
                <li><strong>Problema Relatado:</strong> ${order.reportedProblem}</li>
            </ul>
            <p>Atenciosamente,</p>
            <p>Sua Equipe TSMIT</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p style="${footerStyle}">Este é um e-mail automático, por favor, não responda.</p>
        </div>`;
    
    return { subject: personalizedSubject, htmlContent };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const svcOrder = body.serviceOrder as ServiceOrder;
    const cli = body.client as Client;
    
    const emailSubjectTpl = svcOrder.status?.emailSubject;
    const emailBodyTpl = svcOrder.status?.emailBody;

    if (!svcOrder?.id || !svcOrder.status?.name) {
      return NextResponse.json(
        { error: "serviceOrder.id e serviceOrder.status.name são obrigatórios." },
        { status: 400 }
      );
    }

    if (!emailBodyTpl) {
        return NextResponse.json(
            { error: "O template do corpo do e-mail não foi encontrado para este status. Verifique as configurações de notificação." },
            { status: 400 }
        );
    }

    const recipientEmail = cli.email || svcOrder.collaborator.email;
    const recipientName  = cli.name  || svcOrder.collaborator.name;

    const settingsDocRef = db.collection('settings').doc('email');
    const settingsSnap = await settingsDocRef.get();

    if (!settingsSnap.exists) {
      return NextResponse.json({ error: 'Configurações de e-mail não encontradas no Firestore.' }, { status: 500 });
    }
    
    const emailSettings = settingsSnap.data() as EmailSettings;
    const senderEmail = emailSettings.senderEmail;

    if (!senderEmail) {
        return NextResponse.json({ error: 'E-mail do remetente não configurado no Firestore (settings/email).' }, { status: 500 });
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Nenhum e-mail de destinatário válido.' }, { status: 400 });
    }

    const { subject, htmlContent } = generateDynamicEmailContent(svcOrder, recipientName, emailSubjectTpl, emailBodyTpl);

    await sendEmailWithMailerSend(recipientEmail, recipientName, subject, htmlContent, senderEmail);

    return NextResponse.json({ message: 'E-mail enviado com sucesso via MailerSend.' });

  } catch (error) {
    console.error('Erro ao processar a requisição de e-mail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ error: 'Erro interno do servidor.', details: errorMessage }, { status: 500 });
  }
}
