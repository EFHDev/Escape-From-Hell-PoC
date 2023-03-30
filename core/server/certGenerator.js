/**
 * Generates a Https Certificate
 */
class CertGenerator {
  constructor() {
    this.certDir = internal.resolve(process.cwd(), "./user/certs");
    this.certFile = internal.resolve(this.certDir, "cert.pem");
    this.keyFile = internal.resolve(this.certDir, "key.pem");
  }
  /**
   * Generates a Certificate
   * @param {string} serverIp 
   * @returns {object} { cert, key }
   */
  generate(serverIp) {

    if (fileIO.exist(this.certFile) && fileIO.exist(this.keyFile)) {
      const cert = fileIO.readParsed(this.certFile);
      const key = fileIO.readParsed(this.keyFile);
      return { cert, key };
    }

    // create directory if not exists
    if (!fileIO.exist(this.certDir)) {
      fileIO.mkDir(this.certDir);
    }

    let fingerprint, cert, key;

    ({
      cert,
      private: key,
      fingerprint,
    } = internal.selfsigned.generate(null, {
      keySize: 2048, // the size for the private key in bits (default: 1024)
      days: 365, // how long till expiry of the signed certificate (default: 365)
      algorithm: "sha256", // sign the certificate with specified algorithm (default: 'sha1')
      // extensions: [{ name: "commonName", cA: true, value: this.ip + "/" }], // certificate extensions array
      extensions: [{ name: "commonName", cA: true, value: serverIp + "/" }], // certificate extensions array
      pkcs7: true, // include PKCS#7 as part of the output (default: false)
      clientCertificate: true, // generate client cert signed by the original key (default: false)
      clientCertificateCN: "jdoe", // client certificate's common name (default: 'John Doe jdoe123')
    }));

    logger.logInfo(`Generated self-signed sha256/2048 certificate ${fingerprint}, valid 365 days`);

    fileIO.write(this.certFile, cert, true);
    fileIO.write(this.keyFile, key, true);

    return { cert, key };
  }
}

module.exports.certificate = new CertGenerator();