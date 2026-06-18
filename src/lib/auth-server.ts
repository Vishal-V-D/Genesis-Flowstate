import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier: any = null;

try {
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    if (userPoolId && clientId) {
        verifier = CognitoJwtVerifier.create({
            userPoolId,
            tokenUse: "id",
            clientId,
        });
    } else {
        console.warn("Cognito environment variables missing on server. Token verification will be bypassed in dev/testing if not configured.");
    }
} catch (error) {
    console.error("Failed to initialize Cognito verifier:", error);
}

export interface AuthUser {
    uid: string;
    email: string;
}

export async function verifyToken(req: Request): Promise<AuthUser | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.split(" ")[1];

    if (!verifier) {
        // Fallback for development if Cognito is not yet configured in AWS
        // In production, this should fail open or closed depending on requirements.
        // We will decode it insecurely ONLY if verifier is missing for safety.
        try {
            const parts = token.split(".");
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
                if (payload.sub && payload.email) {
                    return { uid: payload.sub, email: payload.email };
                }
            }
        } catch (e) {}
        return null;
    }

    try {
        const payload = await verifier.verify(token);
        return {
            uid: payload.sub as string,
            email: (payload.email as string) || "",
        };
    } catch (err) {
        console.error("Cognito JWT token verification failed:", err);
        return null;
    }
}
