module.exports = {
    // the TCP port to listen for STOMP connections on
  stompPort: 61613,

    // By default accept connections on all interfaces.
    // The following property can be used to listen on a specific interface. For
    // example, the following would only allow connections from the local machine.
    // stompHost: '127.0.0.1',

    // the HTTP port to listen for HTTP admin connections on
  adminPort: 3000,

    // By default only listen for HTTP admin connections on localhost
  adminHost: '127.0.0.1',

    // The file containing a list of Radio services
  servicesFile: 'bbc-services.json',

    // How often to re-publish messages to subscribers (in seconds)
    // This can be useful to remove that clients have silently disappeared
    //
    // If you are sending messages frequently anyway, this will be ignored
  republishFrequency: 900
}
