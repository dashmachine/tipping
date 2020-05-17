# Dash Send to User

An experiment in sending Dash evonet funds between public keyhash addresses associated with usernames.

[Run example in Browser](tipping.dashmachine.net)

## Instructions for use

This is an experiment using the Dash Platform testnet (Evonet). This example contains potentially insecure transactions. Do not use real credentials! Create test users for the example or use those provided as placeholders.

*   Enter the username of the sender and the mnemonic associated with their account.
*   Enter the username of the recipient.
*   Click on "Pay User" to start the process

## What's happening?

*   **Get senders's "tipping address" from their username:** The identity assciated with the sender's username is retrieved and a public keyhash address is derived from the public key asscoiated with that identity.
*   **Get recipient's "tipping address" from their username:** As above.
*   **Fund the sender's tipping address:** A small amount of eDash is claimed from the automated faucet.
*   **Access sender's account:** Obtain private key from the sender's mnemonic and retrieve the 'tipping' account in a wallet.
*   **Get UTXOs for sender's address:** UTXOs are retrieved from insight (calling getBalance on the account using wallet-lib does not return a balance)
*   **Create transaction to pay recpient:** Use the sender's availbale UTXOs to send to the recipient's "tipping address" (change is simply returned to the sender's tipping address)
*   **[Check recipient's address for balance:** Currently skipped for simplicity - we know from the faucet tx that it is possible to receive funds to a tipping address]
*   **Resolve address to username(s):** The DPNS contract is queried by mapping name owner idenityIds to public key hashes, to find a match for the sender's address. **Note - this may match an array of users as multiple names can be registered per identity.** (see console for activity)

Please monitor the console for errors and try again if it doesn't work! Only smoke-tested in Chrome Browser