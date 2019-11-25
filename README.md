#  Brain–Machine Interface - Flappy Bird

The purpose of this project is to be able to play Flappy Bird using an EEG, primarily focusing on the ratio of alpha to beta powerbands.

## Using OpenBCI 

### Browser Game 

Location: `./game`

The Browser Game is written in javascript (vanilla) and establishes a Websocket Connection with the server (included in this project) to recieve bandpower information from the EEG Headset. 

### Server

Location: `./server`

The server first establishes a UDP connection with OpenBCI to recieve bandpower information, and takes ~ 1/10 samples and broadcasts this to any connected websocket clients.

## DIY EEG (coming soon)

Will demonstrate how to build a basic EEG circuit consisting of an instrumentation amplifier, a [0.5,40] Hz bandpass filter, and a 60 Hz Notch filter.

It will send the analog signal to an Arduino Uno which performs an FFT (Fast Fourier Transform) on the firmware, and sends the  data (in the frequency domain) to a computer using via a Serial connection. 

A Node.js script will recieve this data and compute the bandpower of alpha and beta frequency ranges and broadcast this to all connected websocket clients.