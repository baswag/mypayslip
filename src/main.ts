import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import dotenv from 'dotenv';
import {
  LoginRequestInterface,
  LoginResponseInterface,
  LOGIN_API_ROUTE,
} from './api/login.interface.js';
import {
  DocumentListDocumentInterface,
  DOCUMENT_API_ROUTE,
} from './api/document.interface.js';
import { Stream } from 'stream';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();
    stream.on('data', (chunk) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err) => reject(`error converting stream - ${err}`));
  });
}

const jar = new CookieJar();
const client = wrapper(axios.create({ jar } as any));

async function main() {
  const cookies = await jar.getCookies(
    `${process.env.PAYSLIP_HOST}${DOCUMENT_API_ROUTE}`,
  );
  const cookieIndex = cookies.findIndex(
    (x) => x.key === '.AspNetCore.Identity.Aplication',
  );

  if (cookieIndex < 0 || cookies[cookieIndex].TTL(new Date()) < 60000) {
    console.log(
      'Session cookie not found or about to expire, refreshing session',
    );
    await client.post<LoginResponseInterface>(
      `${process.env.PAYSLIP_HOST}${LOGIN_API_ROUTE}`,
      {
        accountKey: process.env.PAYSLIP_USER,
        password: process.env.PASSWORD,
        persistToken: 'true',
        projectName: 'AIRBUS Deutschland GmbH',
      } as LoginRequestInterface,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
  const documents = (
    await client.get<DocumentListDocumentInterface[]>(
      `${process.env.PAYSLIP_HOST}${DOCUMENT_API_ROUTE}`,
    )
  ).data;

  let shouldNotify = false;
  const documentMap = new Map<string, Buffer>();

  for (const document of documents) {
    if (!document.isNew) {
      continue;
    }

    shouldNotify = true;
    const documentData = await client.get(
      `${process.env.PAYSLIP_HOST}${DOCUMENT_API_ROUTE}/${document.itemId}/${document.documentId}`,
      { responseType: 'stream' },
    );

    documentMap.set(document.name, await stream2buffer(documentData.data));
  }

  if (!shouldNotify) {
    console.log('no new documents available');
  }

  if (
    shouldNotify &&
    process.env.TELEGRAM_TOKEN &&
    process.env.TELEGRAM_CHAT_IDS
  ) {
    const ids = process.env.TELEGRAM_CHAT_IDS!.split(',');
    const telegram = new TelegramBot(process.env.TELEGRAM_TOKEN as string, {
      polling: true,
    });

    for (const id of ids) {
      telegram.sendMessage(id, 'New MyPayslip Document available');
    }
  }

  if (
    shouldNotify &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.EMAIL_TO
  ) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: parseInt(process.env.SMTP_PORT as string, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const attachments = [];

    for (const [documentName, content] of documentMap) {
      attachments.push({
        filename: documentName,
        content,
        contentType: 'application/pdf',
      });
    }

    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? 'MyPayslip <noreply@example.com>',
      to: process.env.EMAIL_TO!.split(','),
      subject: 'New MyPayslip Documents',
      attachments,
    });
  }
}

if (process.argv[2] === 'run') {
  await main();
  process.exit()
} else {
  if (!cron.validate(process.env.CRON_SCHEDULE!)) {
    console.error('cron schedule invalid');
    process.exit(-1);
  } else {
    cron.schedule(process.env.CRON_SCHEDULE!, async () => {
      await main();
    });
  }
}
