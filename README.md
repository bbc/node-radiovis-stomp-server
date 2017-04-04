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


## Deploying

The BBC deploys a lot of its services using RPMs on the CentOS operating system.
We use the [speculate] tool to generate the RPM spec
files and service descriptions in order to install and deploy this RadioVis server.

These are the steps to generate an RPM:

    npm install
    npm test
    npm run spec

Then if you are running on a BBC machine:

    cosmos-build --os=centos7 --repository=radiovis
  
Or if you arn't working within the BBC's development environment, you can use:

    rpmbuild -ba --define "_topdir $PWD" SPECS/radiovis-stomp-server.spec


## Publishing images and text

Content is pushed to clients via a HTTP POST. The content can be sent using either 
URL encoding, or as JSON. Text and Image can be sent using separate requests or in 
the same request. A link may optionally be specified at the same time as an image.

For example to update the *text* for a station using curl:

    curl -v http://localhost:3000/services/bbc_radio_one -d 'text=Hello World'

Or to update the *image* and *link*:

    curl http://localhost:3000/services/bbc_radio_two \
      -d 'image=http://www.bbc.co.uk/staticarchive/497463ddfe1950573912db49d8c10a7683e5b2ca.jpg' \
      -d 'link=http://www.bbc.co.uk/programmes/b006wr3p'


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
