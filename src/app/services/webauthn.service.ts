
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
    // Step 1: Get public key options from server
    const options: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/mfa/register/options/`));

    // Step 2: Create credential
    options.challenge = this._bufferDecode(options.challenge);
    options.user.id = this._bufferDecode(options.user.id);

    const credential: PublicKeyCredential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential;

    // Step 3: Send credential to server
    const credentialData = this._credentialToJSON(credential);
    return this.http.post(`${environment.apiBaseUrl}/mfa/register/complete/`, credentialData).toPromise();

  }

  async authenticate() {
    const options: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/mfa/authenticate/options/`));

    options.challenge = this._bufferDecode(options.challenge);
    options.allowCredentials = options.allowCredentials.map((cred: any) => ({
      ...cred,
      id: this._bufferDecode(cred.id)
    }));

    const assertion = await navigator.credentials.get({ publicKey: options }) as PublicKeyCredential;

    const assertionData = this._credentialToJSON(assertion);
    return this.http.post(`${environment.apiBaseUrl}/mfa/authenticate/complete/`, assertionData).toPromise();

  }

  private _bufferDecode(value: string) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  }

  private _credentialToJSON(pubKeyCred: any): any {
    if (pubKeyCred instanceof Array) {
      return pubKeyCred.map(i => this._credentialToJSON(i));
    }

    if (pubKeyCred instanceof ArrayBuffer) {
      return btoa(String.fromCharCode(...new Uint8Array(pubKeyCred)));
    }

    if (pubKeyCred && typeof pubKeyCred === 'object') {
      const obj: any = {};
      for (const key in pubKeyCred) {
        obj[key] = this._credentialToJSON(pubKeyCred[key]);
      }
      return obj;
    }

    return pubKeyCred;


  }


}
