import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";

const clientConfig: any = {
    region,
};

// Credential handling:
// - In a managed AWS runtime (Amplify SSR / Lambda), credentials are TEMPORARY
//   and include a session token. We must NOT set only accessKeyId+secretKey
//   without the session token, or requests fail with "security token invalid".
//   In that case we leave `credentials` unset so the SDK's default provider
//   chain picks up the full temporary credentials (incl. session token) itself.
// - Only for a true long-lived local key pair (no session token present) do we
//   pass explicit credentials.
if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    !process.env.AWS_SESSION_TOKEN
) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}

export const ddbClient = new DynamoDBClient(clientConfig);
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    },
});
