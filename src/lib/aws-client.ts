import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

export const cognitoClient = new CognitoIdentityProviderClient({ region });

export interface CognitoUserSession {
    uid: string;
    email: string;
    firstName?: string;
    lastName?: string;
    idToken: string;
    accessToken: string;
    refreshToken?: string;
}

// ── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUpUser(email: string, password: string, firstName: string, lastName: string) {
    if (!clientId) throw new Error("Cognito Client ID is not configured");
    
    const command = new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: "email", Value: email },
            { Name: "given_name", Value: firstName },
            { Name: "family_name", Value: lastName },
        ],
    });
    
    return await cognitoClient.send(command);
}

// ── Confirm Sign Up (Verify Code) ───────────────────────────────────────────
export async function confirmSignUpUser(email: string, code: string) {
    if (!clientId) throw new Error("Cognito Client ID is not configured");

    const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
    });

    return await cognitoClient.send(command);
}

// ── Sign In ──────────────────────────────────────────────────────────────────
export async function signInUser(email: string, password: string): Promise<CognitoUserSession> {
    if (!clientId) throw new Error("Cognito Client ID is not configured");

    const command = new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    });

    const response = await cognitoClient.send(command);
    const authResult = response.AuthenticationResult;

    if (!authResult || !authResult.IdToken || !authResult.AccessToken) {
        throw new Error("Authentication failed: invalid credentials or flow");
    }

    const idToken = authResult.IdToken;
    const accessToken = authResult.AccessToken;
    const refreshToken = authResult.RefreshToken;

    // Decode ID Token payload to get UID (sub) and names
    const parts = idToken.split(".");
    const payload = JSON.parse(window.atob(parts[1]));

    const session: CognitoUserSession = {
        uid: payload.sub,
        email: payload.email || email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        idToken,
        accessToken,
        refreshToken,
    };

    // Store in localStorage for persistence
    localStorage.setItem("flowstate_session", JSON.stringify(session));

    return session;
}

// ── Sign Out ─────────────────────────────────────────────────────────────────
export function signOutUser() {
    localStorage.removeItem("flowstate_session");
}

// ── Get Current Session ──────────────────────────────────────────────────────
export function getCurrentSession(): CognitoUserSession | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("flowstate_session");
    if (!data) return null;
    try {
        const session = JSON.parse(data) as CognitoUserSession;
        // Verify expiry of ID Token
        const parts = session.idToken.split(".");
        const payload = JSON.parse(window.atob(parts[1]));
        const exp = payload.exp * 1000;
        if (Date.now() >= exp) {
            signOutUser();
            return null;
        }
        return session;
    } catch (e) {
        return null;
    }
}
