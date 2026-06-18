import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";

const clientConfig: any = {
    region,
};

// Check for local credentials (e.g. during local run or in env configuration).
// When deployed to production AWS hosts, the SDK automatically retrieves credentials from the environment or IAM Role.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
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
