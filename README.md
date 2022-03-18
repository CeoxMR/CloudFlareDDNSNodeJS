# CloudFlareDDNSNodeJS
This is just a script on node that grabs our dynamic public IP and updates a domain DNS A record in cloudflare automatically.

I have this setup on a linux env, using a cron job to run it every 5 minutes.

*/5 * * * * node /yourFilesDirectory/domain.js
