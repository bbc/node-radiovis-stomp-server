[![Build Status](https://travis-ci.org/bbc/node-radiovis-stomp-server.svg?branch=master)](https://travis-ci.org/bbc/node-radiovis-stomp-server)

RadioVis STOMP Server
=====================

This is an implementation of a subset of the [STOMP protocol] in [node.js],
for purpose of deploying a [RadioVis] service.

RadioVis was standardised in [ETSI TS 101 499], _Hybrid Digital Radio (DAB, DRM, RadioDNS); SlideShow;
User Application Specification_.


## Running

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


## License

Copyright 2017 British Broadcasting Corporation

The RadioVis STOMP Server is free software; you can redistribute it and/or
modify it under the terms of the Apache License, Version 2.0.

The RadioVis STOMP Server is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
or FITNESS FOR A PARTICULAR PURPOSE.  See the Apache License, Version 2.0 for
more details.



[node.js]:         https://nodejs.org/
[STOMP protocol]:  https://stomp.github.io/stomp-specification-1.0.html
[speculate]:       https://github.com/bbc/speculate
[RadioVis]:        https://en.wikipedia.org/wiki/RadioVIS
[ETSI TS 101 499]: http://www.etsi.org/deliver/etsi_ts/101400_101499/101499/03.01.01_60/ts_101499v030101p.pdf
