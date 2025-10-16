import { NextResponse } from 'next/server';
import { importKeyFromString, decryptData } from '@/_lib/crypto';

export async function POST(request: Request) {
  try {
    const { wrappedKey: wrappedKeyString } = await request.json();

    if (!wrappedKeyString) {
      return NextResponse.json({ error: 'Missing wrappedKey' }, { status: 400 });
    }

    const wrappingKeyString = process.env.WRAPPING_KEY;
    if (!wrappingKeyString) {
      throw new Error('Wrapping key is not configured on the server.');
    }

    const wrappingKey = await importKeyFromString(wrappingKeyString);
    const wrappedKeyBuffer = Buffer.from(wrappedKeyString, 'base64');
    const letterKeyBuffer = await decryptData(wrappingKey, wrappedKeyBuffer);
    const letterKeyString = new TextDecoder().decode(letterKeyBuffer);

    return NextResponse.json({ key: letterKeyString });
  } catch (error) {
    console.error('Key unwrapping failed:', error);
    return NextResponse.json({ error: 'Failed to unwrap key' }, { status: 500 });
  }
}