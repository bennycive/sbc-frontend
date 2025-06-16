import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebauthnService {
  constructor(private http: HttpClient) {}

  async register() {
    const options: any = await firstValueFrom(
      this.http.get(`${environment.apiBaseUrl}/users/mfa/register/options/`)
    );

    // Decode challenge and user ID
    options.challenge = this._bufferDecode(options.challenge);
    options.user.id = this._bufferDecode(options.user.id);

    const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential;

    const credentialJSON = this._serializePublicKeyCredential(credential);
    console.log('Registration payload:', credentialJSON);

    return await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/users/mfa/register/complete/`, credentialJSON, { withCredentials: true })
      
    );
  }

  async authenticate() {
    const options: any = await firstValueFrom(
      this.http.get(`${environment.apiBaseUrl}/mfa/authenticate/options/`)
    );

    options.challenge = this._bufferDecode(options.challenge);
    options.allowCredentials = options.allowCredentials.map((cred: any) => ({
      ...cred,
      id: this._bufferDecode(cred.id)
    }));

    const assertion = await navigator.credentials.get({ publicKey: options }) as PublicKeyCredential;

    const assertionJSON = this._serializePublicKeyCredential(assertion);
    console.log('Authentication payload:', assertionJSON);

    return await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/mfa/authenticate/complete/`, assertionJSON)
    );
  }

  // ✅ Updated to support base64url and standard base64
  private _bufferDecode(value: string): Uint8Array {
    // Convert base64url -> base64
    const base64 = value
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  private _arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private _arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const base64 = this._arrayBufferToBase64(buffer);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private _serializePublicKeyCredential(cred: any): any {
    if (!cred) return cred;

    if (cred instanceof ArrayBuffer) {
      return this._arrayBufferToBase64Url(cred);
    }

    if (Array.isArray(cred)) {
      return cred.map(item => this._serializePublicKeyCredential(item));
    }

    if (typeof cred === 'object') {
      const obj: any = {};
      for (const key in cred) {
        if (cred.hasOwnProperty(key)) {
          obj[key] = this._serializePublicKeyCredential(cred[key]);
        }
      }
      return obj;
    }

    return cred;
  }


}
