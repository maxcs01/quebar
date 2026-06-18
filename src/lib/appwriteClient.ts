import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://sfo.cloud.appwrite.io/v1")
    .setProject("6a1984eb00307378c411");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
