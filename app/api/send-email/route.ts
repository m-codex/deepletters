import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, shareLink } = await req.json();

    if (!to || !subject || !body || !shareLink) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const emailHtml = `
      <p>${body}</p>
      <p>View the letter here: <a href="${shareLink}">${shareLink}</a></p>
      <br>
      <p><small>This letter was created with deepletters.org.</small></p>
    `;

    const { data, error } = await resend.emails.send({
      from: 'User of deepletters.org <noreply@letters.deepletters.org>',
      to: [to],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send email.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully!', data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
