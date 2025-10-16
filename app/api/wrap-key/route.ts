import { NextResponse } from 'next/server';
import { importKeyFromString, encryptData } from '@/_lib/crypto';

export async function POST(request: Request) {
  try {
    const { key: letterKeyString } = await request.json();

    if (!letterKeyString) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const wrappingKeyString = process.env.WRAPPING_KEY;
    if (!wrappingKeyString) {
      throw new Error('Wrapping key is not configured on the server.');
    }

    const wrappingKey = await importKeyFromString(wrappingKeyString);
    const letterKeyBuffer = new TextEncoder().encode(letterKeyString);
    const wrappedKeyBuffer = await encryptData(wrappingKey, letterKeyBuffer);

    // Convert ArrayBuffer to a string representation for the JSON response
    const wrappedKeyString = Buffer.from(wrappedKeyBuffer).toString('base64');

    return NextResponse.json({ wrappedKey: wrappedKeyString });
  } catch (error) {
    console.error('Key wrapping failed:', error);
    return NextResponse.json({ error: 'Failed to wrap key' }, { status: 500 });
  }
}