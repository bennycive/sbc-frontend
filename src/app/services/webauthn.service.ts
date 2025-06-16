import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebauthnService {
  constructor(private http: HttpClient) {}

  // Converts base64url string to Uint8Array
  private _bufferDecode(value: string): Uint8Array {
    // Add padding if missing
    value = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = value.length % 4;
    if (pad) {
      value += '='.repeat(4 - pad);
    }
    const decoded = atob(value);
    const array = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      array[i] = decoded.charCodeAt(i);
    }
    return array;
  }

  // Convert hex string to Uint8Array
  private _hexStringToUint8Array(hexString: string): Uint8Array {
    if (hexString.length % 2 !== 0) {
      hexString = '0' + hexString;
    }
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // Parse JWT payload (base64url decode)
  private _parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  // Serialize PublicKeyCredential to a plain JSON object
  private _serializePublicKeyCredential(credential: PublicKeyCredential): any {
    return {
      id: credential.id,
      rawId: this._arrayBufferToBase64Url(credential.rawId),
      response: {
        clientDataJSON: this._arrayBufferToBase64Url(credential.response.clientDataJSON),
        attestationObject:
          (credential.response as any).attestationObject
            ? this._arrayBufferToBase64Url((credential.response as any).attestationObject)
            : undefined,
        authenticatorData:
          (credential.response as any).authenticatorData
            ? this._arrayBufferToBase64Url((credential.response as any).authenticatorData)
            : undefined,
        signature:
          (credential.response as any).signature
            ? this._arrayBufferToBase64Url((credential.response as any).signature)
            : undefined,
        userHandle:
          (credential.response as any).userHandle
            ? this._arrayBufferToBase64Url((credential.response as any).userHandle)
            : undefined,
      },
      type: credential.type,
      clientExtensionResults: credential.getClientExtensionResults(),
    };
  }

  // Convert ArrayBuffer to base64url string
  private _arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Main registration function
  async register() {
    // 1. Get registration options from backend
    const optionsResponse: any = await firstValueFrom(
      this.http.get('http://localhost:8000/api/users/mfa/register/options/')
    );

    const publicKey = optionsResponse.publicKey;
    const challengeJWT = publicKey.challenge; // The JWT string from backend

    // 2. Parse challenge JWT payload to extract the actual challenge bytes for navigator.credentials API
    const payload = this._parseJwt(challengeJWT);
    publicKey.challenge = this._bufferDecode(payload.challenge);

    // 3. Convert user id from hex string to Uint8Array
    publicKey.user.id = this._hexStringToUint8Array(publicKey.user.id);

    // 4. Call WebAuthn API to create credential
    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;

    // 5. Send credential + challengeJWT back to backend for verification
    const body = {
      pubKeyCredential: JSON.stringify(this._serializePublicKeyCredential(credential)),
      challengeJWT: challengeJWT,
    };

    return await firstValueFrom(
      this.http.post('http://localhost:8000/api/users/mfa/register/complete/', body, { withCredentials: true })
    );
  }
}
