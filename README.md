#  Brain–Machine Interface - Flappy Bird

The purpose of this project is to be able to play Flappy Bird using an EEG where focusing will cause the bird to move up and relaxing will move the bird down. This inference will be made on the client side (browser) using a logistic regression model.

## Using OpenBCI Cyton Circuit + EEG Cap

### Browser Game 

Location: `./game`

The Browser Game is written in javascript (vanilla) and establishes a Websocket Connection with the server (included in this project) to recieve bandpower information from the server. 

### Server

Location: `./server`

The server first establishes a UDP connection with OpenBCI EEG GUI to recieve bandpower information and broadcasts this to the browser game.

### Datasets

Location: `./datasets`

These are JSON bandpower recordings with two classes (Relaxed/Focused) used to train the LR model.

### Model

Location: `./model`

This is a logistic regression classifier which ingests the data within `./datasets`, trains the model, and produces a serialized model in JSON file which can be loaded at runtime within the browser game.

## DIY EEG

I will demonstrate how to build a basic EEG circuit consisting of an instrumentation amplifier, a [0.5,40] Hz second-order butterworth bandpass filter, and a 60 Hz notch filter.

It will send the analog signal to an Arduino Uno which performs an FFT (Fast Fourier Transform) on the firmware, and sends a Welch periodogram (bandpower data) to a computer via a UART. 

A Node.js script will recieve the serialized data and broadcast this to the browser where in turn a logistic regression model will predict whether or not a subject is Attentive (Focused) or Relaxed.
