const { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { RDSClient, CreateDBInstanceCommand } = require("@aws-sdk/client-rds");
const crypto = require("crypto");

// Load local environment credentials if any, otherwise AWS SDK automatically loads from environment
const region = process.env.AWS_REGION || "us-east-1";
const credentials = process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
} : undefined;

const cognitoClient = new CognitoIdentityProviderClient({ region, credentials });
const dynamoClient = new DynamoDBClient({ region, credentials });
const rdsClient = new RDSClient({ region, credentials });

async function setupCognito() {
    console.log("🚀 Provisioning AWS Cognito User Pool...");
    try {
        const createPool = new CreateUserPoolCommand({
            PoolName: "flowstate-user-pool",
            UsernameAttributes: ["email"],
            AutoVerifiedAttributes: ["email"],
            Schema: [
                { Name: "given_name", AttributeDataType: "String", Required: true, Mutable: true },
                { Name: "family_name", AttributeDataType: "String", Required: true, Mutable: true }
            ],
            PasswordPolicy: {
                MinimumLength: 8,
                RequireUppercase: true,
                RequireLowercase: true,
                RequireNumbers: true,
                RequireSymbols: false
            }
        });
        const poolRes = await cognitoClient.send(createPool);
        const userPoolId = poolRes.UserPool.Id;
        console.log(`✅ Cognito User Pool created: ${userPoolId}`);

        console.log("🚀 Creating Cognito App Client (no secret)...");
        const createClient = new CreateUserPoolClientCommand({
            UserPoolId: userPoolId,
            ClientName: "flowstate-web-client",
            GenerateSecret: false, // Must be false for public web client
            ExplicitAuthFlows: [
                "ALLOW_USER_PASSWORD_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH"
            ]
        });
        const clientRes = await cognitoClient.send(createClient);
        const clientId = clientRes.UserPoolClient.ClientId;
        console.log(`✅ Cognito App Client created: ${clientId}`);

        return { userPoolId, clientId };
    } catch (err) {
        if (err.name === "ResourceInUseException" || err.message.includes("already exists")) {
            console.log("ℹ️ Cognito User Pool 'flowstate-user-pool' already exists.");
        } else {
            console.error("❌ Failed to set up Cognito:", err.message);
        }
        return null;
    }
}

async function createDynamoTable(tableConfig) {
    console.log(`🚀 Provisioning DynamoDB Table: ${tableConfig.TableName}...`);
    try {
        const command = new CreateTableCommand(tableConfig);
        await dynamoClient.send(command);
        console.log(`✅ Table ${tableConfig.TableName} created successfully.`);
    } catch (err) {
        if (err.name === "ResourceInUseException" || err.name === "TableAlreadyExistsException") {
            console.log(`ℹ️ Table ${tableConfig.TableName} already exists. Skipping.`);
        } else {
            console.error(`❌ Failed to create table ${tableConfig.TableName}:`, err.message);
        }
    }
}

async function setupDynamoDB() {
    // 1. FlowstateUsers
    await createDynamoTable({
        TableName: "FlowstateUsers",
        KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" }
        ],
        BillingMode: "PROVISIONED",
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    });

    // 2. FlowstateWorkspaces
    await createDynamoTable({
        TableName: "FlowstateWorkspaces",
        KeySchema: [
            { AttributeName: "workspaceId", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
            { AttributeName: "workspaceId", AttributeType: "S" },
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "updatedAt", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "UserWorkspacesIndex",
                KeySchema: [
                    { AttributeName: "userId", KeyType: "HASH" },
                    { AttributeName: "updatedAt", KeyType: "RANGE" }
                ],
                Projection: { ProjectionType: "ALL" },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
        ],
        BillingMode: "PROVISIONED",
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    });

    // 3. FlowstateUserWorkspaces
    await createDynamoTable({
        TableName: "FlowstateUserWorkspaces",
        KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "workspaceId", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "workspaceId", AttributeType: "S" }
        ],
        BillingMode: "PROVISIONED",
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    });
}

async function setupRDS(password) {
    console.log("🚀 Provisioning Amazon RDS PostgreSQL Instance (db.t3.micro)...");
    try {
        const command = new CreateDBInstanceCommand({
            DBInstanceIdentifier: "flowstate-postgres",
            Engine: "postgres",
            EngineVersion: "15",
            DBInstanceClass: "db.t3.micro",
            AllocatedStorage: 20,
            StorageType: "gp2",
            DBName: "flowstate",
            MasterUsername: "postgres",
            MasterUserPassword: password,
            PubliclyAccessible: true
        });
        await rdsClient.send(command);
        console.log("✅ RDS database creation successfully initiated.");
    } catch (err) {
        if (err.name === "DBInstanceAlreadyExists" || err.message.includes("already exists")) {
            console.log("ℹ️ RDS Instance 'flowstate-postgres' already exists. Skipping.");
        } else {
            console.error("❌ Failed to create RDS Instance:", err.message);
        }
    }
}

async function main() {
    console.log("=========================================");
    console.log("FlowState AWS Automated Provisioning Tool");
    console.log("=========================================");
    
    // Generate secure random password for database
    const dbPassword = crypto.randomBytes(16).toString("hex") + "A1!";
    
    const cognitoResult = await setupCognito();
    await setupDynamoDB();
    await setupRDS(dbPassword);
    
    console.log("\n=========================================");
    console.log("🎉 Provisioning commands successfully sent!");
    console.log("=========================================");
    
    if (cognitoResult) {
        console.log(`Copy these values to your Frontend .env file:\n`);
        console.log(`NEXT_PUBLIC_AWS_REGION=${region}`);
        console.log(`NEXT_PUBLIC_COGNITO_USER_POOL_ID=${cognitoResult.userPoolId}`);
        console.log(`NEXT_PUBLIC_COGNITO_CLIENT_ID=${cognitoResult.clientId}`);
        console.log(`AWS_REGION=${region}`);
    }
    
    console.log(`\nCopy these values to your Backend .env file:\n`);
    console.log(`DATABASE_URL=postgresql://postgres:${dbPassword}@<RDS_ENDPOINT_HERE>:5432/flowstate`);
    console.log(`\n*(Note: Amazon RDS takes 5-10 minutes to finish creating your database instance. `);
    console.log(`Once ready, fetch its endpoint from the AWS Console under RDS -> Databases -> flowstate-postgres)*`);
    console.log("=========================================\n");
}

main();
