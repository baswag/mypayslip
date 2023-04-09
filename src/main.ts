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
import fs from 'fs';
dotenv.config();
const jar = new CookieJar();
const client = wrapper(axios.create({ jar } as any));

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

const documents = (
  await client.get<DocumentListDocumentInterface[]>(
    `${process.env.PAYSLIP_HOST}${DOCUMENT_API_ROUTE}`,
  )
).data;

let shouldNotify = false;

documents[0].isNew = true;

for (const document of documents) {
  if (!document.isNew) {
    continue;
  }

  shouldNotify = true;
  const documentData = await client.get(
    `${process.env.PAYSLIP_HOST}${DOCUMENT_API_ROUTE}/${document.itemId}/${document.documentId}`,
    { responseType: 'stream' },
  );
  documentData.data.pipe(fs.createWriteStream(document.name));

  await new Promise<void>((resolve, reject) => {
    documentData.data.on('end', () => {
      resolve();
    });

    documentData.data.on('error', () => {
      reject();
    });
  });
}

if (shouldNotify) {
  console.log('New MyPayslip Document available');
}
