import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 14 * 24 * 60 * 60, // 14 days
};

// Create session (POST)
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create session cookie (14 days)
    const expiresIn = 14 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Update user's last login in Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      const userRecord = await adminAuth.getUser(uid);
      await userRef.set({
        email: userRecord.email || null,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        role: decodedToken.role || 'user',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Update last login
      await userRef.update({
        lastLoginAt: FieldValue.serverTimestamp(),
      });
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, COOKIE_OPTS);

    return NextResponse.json({
      success: true,
      user: {
        uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user',
      },
    });
  } catch (e: any) {
    console.error('[auth/session POST]', e);
    return NextResponse.json(
      { error: e?.message ?? 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Get session (GET)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true // checkRevoked
    );

    // Get user data from Firestore
    const userDoc = await adminDb
      .collection('users')
      .doc(decodedClaims.uid)
      .get();

    const userData = userDoc.exists ? userDoc.data() : {};

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        displayName: userData?.displayName || decodedClaims.name,
        photoURL: userData?.photoURL || decodedClaims.picture,
        role: userData?.role || decodedClaims.role || 'user',
      },
    });
  } catch (e: any) {
    console.error('[auth/session GET]', e);
    return NextResponse.json({ authenticated: false });
  }
}

// Delete session (DELETE)
export async function DELETE() {
  try {
    const cookieStore = await cookies();

    // Clear the session cookie
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      ...COOKIE_OPTS,
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[auth/session DELETE]', e);
    return NextResponse.json(
      { error: e?.message ?? 'Failed to clear session' },
      { status: 500 }
    );
  }
}
