import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function runTest() {
  console.log('Testing Resend with API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
  console.log('From Email:', process.env.EMAIL_FROM);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '"LoobyCard" <hotro@loobycard.com>',
      to: ['hotro@loobycard.com'], // testing sending to ourselves
      subject: 'Test Resend Integration',
      html: '<h1>Resend Test</h1><p>Integration is successful.</p>',
    });

    if (error) {
      console.error('Failed to send email:', error);
    } else {
      console.log('Email sent successfully!', data);
    }
  } catch (e) {
    console.error('Exception during test:', e);
  }
}

runTest();
