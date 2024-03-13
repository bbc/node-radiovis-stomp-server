RadioVis STOMP Server
=====================

This is an implementation of a subset of the [STOMP protocol] in [node.js],
for purpose of deploying a [RadioVis] service.

RadioVis was standardised in [ETSI TS 101 499], _Hybrid Digital Radio (DAB, DRM, RadioDNS); SlideShow;
User Application Specification_.


## Running

The recommended version of Node.js is v20

    npm install
    npm start

This will start a STOMP server running on port 61613.


## Publishing images and text

Content is pushed to clients via a HTTP POST. The content can be sent using either 
URL encoding, or as JSON. Text and Image can be sent using separate requests or in 
the same request. A link may optionally be specified at the same time as an image.

For example to update the *text* for a station using curl:

    curl -v http://localhost:3000/services/station1 -d 'text=Hello World'

Or to update the *image* and *link*:

    curl http://localhost:3000/services/station2 \
      -d 'image=http://www.example.com/images/myimage.jpg' \
      -d 'link=http://www.example.com/programmes/breakfast'


## Running Tests

    npm test

To generate a test coverage report:

    npm run coverage


## Settings

The [settings.js](settings.js) file is used to configure the server.
It supports the following confection options:

| Setting Name         | Default         | Description             |
| -------------------- | --------------- | ----------------------- | 
| `stompPort`          | `61613`         | STOMP port to listen for client connections on.    |
| `stompHost`          | `0.0.0.0`       | IP address to bind STOMP connections to.           |
| `adminPort`          | `3000`          | HTTP port to listen for HTTP admin connections on. |
| `adminHost`          | `127.0.0.1`     | IP address to bind HTTP admin interface to.        | 
| `servicesFile`       | `services.json` | JSON file to load list of broadcast services from. |
| `republishFrequency` | `900`           | How often to re-publish messages to subscribers.   |
| `wildcard`           | `false`         | Enable support for wildcard bearer in topics (`*`) |


## Testing

BBC R&D have written a GUI python tool called RadioVisDemo which can be useful to test a RadioVis server:

https://github.com/bbc/RadioVisDemo

Or to test using the command-line, you could use the [stomp.py tool] to subscribe to messages:

```
stomp -H 127.0.0.1 -P 61613 -S 1.0 -L '/topic/fm/ce2/c201/09710/text'
```

Here is is another example subscribing to all services using a wildcard topic:

```
stomp -H 127.0.0.1 -P 61613 -S 1.0 -L '/topic/*/text' --verbose
```


## License

Copyright 2017-2024 British Broadcasting Corporation

The RadioVis STOMP Server is free software; you can redistribute it and/or
modify it under the terms of the Apache License, Version 2.0.

The RadioVis STOMP Server is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
or FITNESS FOR A PARTICULAR PURPOSE.  See the Apache License, Version 2.0 for
more details.


The [favicon.ico] image was created from the Mozilla radio SVG:

https://github.com/mozilla/fxemoji/blob/gh-pages/svgs/objects/u1F4FB-radio.svg

Which is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0):

https://creativecommons.org/licenses/by/4.0/



[node.js]:         https://nodejs.org/
[STOMP protocol]:  https://stomp.github.io/stomp-specification-1.0.html
[stomp.py tool]:   https://jasonrbriggs.github.io/stomp.py/commandline.html
[speculate]:       https://github.com/bbc/speculate
[RadioVis]:        https://en.wikipedia.org/wiki/RadioVIS
[ETSI TS 101 499]: http://www.etsi.org/deliver/etsi_ts/101400_101499/101499/03.01.01_60/ts_101499v030101p.pdf

[favicon.ico]:     /public/favicon.ico
