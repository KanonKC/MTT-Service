import GoogleAuth from "@/externals/google-auth/google-auth";

export default class AuthService {
    private readonly googleAuth: GoogleAuth;
    constructor(googleAuth: GoogleAuth) {
        this.googleAuth = googleAuth;
    }

    getGoogleOAuthUrl() {
        return this.googleAuth.generateOAuthUrl();
    }

    async loginWithGoogle(code: string) {
        return this.googleAuth.login(code);
    }
}