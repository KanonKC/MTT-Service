import Configuration from "@/configs";
import GoogleAuth from "@/externals/google-auth/google-auth";

function generateGoogleLoginUrl() {
    const config = new Configuration();
    const googleAuth = new GoogleAuth(config);
    const url = googleAuth.generateOAuthUrl();
    console.log(url);
}

generateGoogleLoginUrl();