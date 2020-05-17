
var client = null;

const faucetURL = 'https://qetrgbsx30.execute-api.us-west-1.amazonaws.com/stage/?dashAddress='

const insightURL = 'http://insight.evonet.networks.dash.org:3001/insight-api/addr/';

async function connect(mnemonic) {
    try {
        var clientOpts = {
            mnemonic: mnemonic,
        };
        $("#result").append(`connecting with mnemonic : ${mnemonic}<br/>`);
        client = new Dash.Client(clientOpts);
        await client.isReady()
        return;
    }
    catch (e) {

        throw e
    }
}

async function getUserAddress(username) {
    try {
        //get identity from DPNS contact
        const { identities, names } = client.platform;
        const identityId = (await names.get(username)).data.records
            .dashIdentity;

        $("#result").append(`identityid: ${identityId}<br/>`);
        //get idenity
        const identity = await identities.get(identityId);
        //get address
        const userAddress = new Dash.Core.Address(
            //new Dash.Core.PublicKey(Buffer.from(identity.publicKeys[0].data, 'base64')),
            new Dash.Core.PublicKey(Base64Binary.decode(identity.publicKeys[0].data)),
            Dash.Core.Networks.testnet).toString();
        return userAddress;

    }
    catch (e) {

        throw e
    }
}

async function getPrivateKey() {
    try {

        const k = await client.account.getIdentityHDKey(0, 'user').privateKey;
        return k;

    }
    catch (e) {

        throw e
    }


}


async function getAccount() {
    try {

        const BIP44Account = wallet.getAccount("m/9'/5'/5'");

        const BIP44AccountAddress = BIP44Account.getAddress().address;

        $("#result").append('BIP44 Address', BIP44AccountAddress, '<br/>');

    }
    catch (e) {

        throw e
    }


}



async function sendUsingWalletLib(senderPrivateKey, recipientAddress) {


    try {

        const wallet = new Wallet({
            network: 'testnet',
            privateKey: senderPrivateKey
        });




        const BIP44Account = wallet.getAccount("m/9'/5'/5'");

        const BIP44AccountAddress = BIP44Account.getAddress().address;

        $("#result").append("DIP 09 path to account m/9'/5'/5'", BIP44AccountAddress, '<br/>');

        //$("#result").append('BIP44 Balance', BIP44Account.getTotalBalance(), '<br/>');


        const utxo = await getUTXO(insightURL, BIP44AccountAddress); //(wallet.getAccount().getAddress(0).address);


        /*
        alternative: create tx using DashCore Transaction directly
        
        const tx = new Dash.Core.Transaction()
            .from(utxo)          // Feed information about what unspent outputs one can use
            .to('yT94r3x4buMkBjkHVLPyoq2t6ZqcpiXWHx', 200000)  // Add an output with the given amount of satoshis
            .change(changeAddress)      // Sets up a change address where the rest of the funds will go
            .sign(userIdentityPrivateKey)     // Signs all the inputs it can
        */


        const sendOpts = {
            recipient: recipientAddress,
            satoshis: 50000,
            utxos: utxo,
            privateKeys: [senderPrivateKey]
        };

        const changeAddress = BIP44AccountAddress //return change to identity address
        //$("#result").append('changeAddress', changeAddress,'<br/>')

        const tx = BIP44Account.createTransaction(sendOpts);


        $("#result").append('tx:' + tx +  '<br/>');

        const signedTx = BIP44Account.sign(tx, senderPrivateKey);
        $("#result").append('signedTx', signedTx, '<br/>');

        $("#result").append('broadcasting transaction'  , '<br/>');
        //send TX
        const txId = await BIP44Account.broadcastTransaction(tx);

        $("#result").append('txId:', "<a href='http://insight.evonet.networks.dash.org:3001/insight/tx/"+ txId+"'>"+txId+"</a>", '<br/>');

        return txId
    }
    catch (e) {

        throw e
    }

}


async function fundAccount(faucetURL, address, amount) {

    try {

        const response = await axios.get(faucetURL + address);
        return 0; //response code
    }
    catch (e) {

        throw e

    }
}


async function getUTXO(insightURL, addr) {
    try {

        $("#result").append('insight URL:', insightURL + addr + '/utxo', '<br/>')
        const response = await axios.get(insightURL + addr + '/utxo');
        //$("#result").append(response);
        const utxo = response.data;
        $("#result").append('utxo:', utxo, '<br/>')
        return utxo;


    } catch (error) {
        console.error(error);
        throw error
    }
}

async function getSenderFromAddress(addressToSearch) {
    try {
        const platform = client.platform;
        //await client.isReady();

        let lastCount = 0;
        while (true) {
            let documents;
            let usernames = [];
            let startAt = lastCount;
            do {
                let retry = true;
                do {
                    try {
                        documents = await platform.documents.get('dpns.domain', { startAt });
                        console.dir(documents);

                        retry = false;
                    } catch (e) {
                        console.error(e.metadata);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } while (retry);
                usernames = usernames.concat(
                    documents.map(d => ({
                        label: d.data.normalizedLabel,
                        domain: d.data.normalizedParentDomainName,
                        id: d.ownerId
                    }))
                );
                startAt += 100;
            } while (documents.length === 100);

            if (lastCount === 0) {


                const addrArray = usernames.map(
                    async u => {
                        const identity = await platform.identities.get(u.id)
                        console.log('decode public key');
                        const address = new Dash.Core.PublicKey(Base64Binary.decode(identity.publicKeys[0].data)).toAddress(Dash.Core.Networks.testnet).toString();
                        console.log('decode public key: ', identity.publicKeys[0].data, ' to address: ', address );
                        return { address: address, id: u.id, name: u.label };
                    });

                const nameAddresses = await Promise.all(addrArray);




                const matches = nameAddresses.filter(
                    a => a.address === addressToSearch
                )

                $("#result").append('found', matches.length, 'matching Addresses from total of ', usernames.length, '<br/>');

                console.dir(matches);

                return matches;


            }

            lastCount += usernames.length;
            if (usernames.length === 0) { return };

        }
    }
    catch (e) {
        throw e;
    }

}
