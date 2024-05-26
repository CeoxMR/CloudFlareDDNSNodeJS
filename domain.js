const axios = require('axios');

const token = '';         // This will be your API Key or Token.
const zone = '';          // This will be your Zone ID.
const email = '';         // The email address you use to log into your cloudflare's account.
const method = 'global';  // Set it to global if you are using the global API Key, otherwise leave it blank ''.
const domain = '';        // This will be the domain you want to update.

let authHeader = '';
let domainRecord = {};

function getDate() {
    let date = new Date();
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    console.log(`Current date and time: ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
}

console.log(`
#########################################
 Starting with the DNS Update...
#########################################`);
getDate();

(async () => {

    // Getting current public IP.
    console.log('Getting your current IP Address..');
    const ipify = await axios.get('https://api.ipify.org/');
    const ip = ipify.data

    // Checking if the IP was received.
    if (ip === undefined) {
        console.log('[Error] >> unable to find the ip...');
        process.exit();
    }
    console.log('>> Your current public IP is: ', ip);

    // Validating if there has been an IP change since the last run
    if (process.env.CFDNS_LAST_IP == ip) {
        console.log('>> The IP address hasn not changed since the last run, your current IP is: ', process.env.CFDNS_LAST_IP)
        process.exit();
    }
    // Updating the env variable with the current public IP
    process.env.CFDNS_LAST_IP = ip

    // Setting proper authentication method.
    if (method === 'global') {
        authHeader = 'X-Auth-Key';
    } else {
        authHeader = 'Authorization: Bearer ';
    }
    let axiosConfig = {
        headers: {
            "X-Auth-Email": email,
            'Content-Type': 'application/json'
        }
    }
    axiosConfig.headers[authHeader] = token;


    // Checking if the domains has an A record
    console.log('Checking if the domain has an A record created...');
    try {
        domainRecord = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?type=A&name=${domain}`, axiosConfig)
        domainRecord = domainRecord.data.result;
    } catch (err) {
        console.log('[Error] ', err.res);
    }

    if (domainRecord.length !== 1) {
        console.log(`[Error] >> No record was found for your domain ${domain}, please go into your dashboard and set a new record pointing to the ip: ${ip}`);
        process.exit();
    }

    console.log(`>> A record was found for your domain ${domain}`);
    domainRecord = domainRecord[0];

    if (domainRecord.content === ip) {
        console.log(`[Error] >> Your current public ip [${ip}] already match the one for your domain [${domain}:${domainRecord.content}]`);
        process.exit();
    }

    console.log(`>> Updating the A record for ${domain}, IP address will be set to ${ip}`);
    try {
        const recordUpdateUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${domainRecord.id}`;
        const recordUpdateBody = {
            content: `${ip}`,
        }

        const domainRecordUpdate = await axios.patch(recordUpdateUrl, recordUpdateBody, axiosConfig);

        if (domainRecordUpdate.data.success) {
            console.log(`>> The A record for ${domain} has been successfully updated to: ${ip}`);
        } else {
            console.log('[Error] >> Record update was unsuccessful please check the parameters and try again.')
        }
    } catch (err) {
        console.log('[Error]', err.response);
    }

    process.exit();
})();
