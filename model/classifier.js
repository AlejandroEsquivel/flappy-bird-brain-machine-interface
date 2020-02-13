const { LogisticRegression } = require('machinelearn/linear_model');
const fs = require('fs');

const ATTENTION_RESPONSE = 1;
const RELAXATION_RESPONSE = 0;

const prepareFeatureVector = (vector) => {
    const { delta, theta, alpha, gamma, beta } = vector;
    return [
        alpha, 
        beta, 
        delta, 
        theta, 
        gamma, 
        delta*theta,
        delta*theta*alpha,
        (beta/alpha), 
        (beta/(alpha+delta)), 
        (beta/(alpha+delta+theta))
    ];
}

const getDataset = () => {

    const designMatrix = [];
    const responseVector  = [];

    const attentionDatasetPath = './../datasets/attention.json';
    const relaxationDatasetPath = './../datasets/relaxation.json';

    if(!fs.existsSync(attentionDatasetPath) || ! fs.existsSync(relaxationDatasetPath)){
        console.warn('You must generate a dataset using the web application before training.');
        return process.exit(1);
    }

    const attentionData = JSON.parse(fs.readFileSync(attentionDatasetPath));
    const relaxationData = JSON.parse(fs.readFileSync(relaxationDatasetPath));

    attentionData.forEach(vector => {
        const features = prepareFeatureVector(vector);
        designMatrix.push(features);
        responseVector.push(ATTENTION_RESPONSE);
    });

    relaxationData.forEach(vector => {
        const features = prepareFeatureVector(vector);
        designMatrix.push(features);
        responseVector.push(RELAXATION_RESPONSE);
    });

    return [designMatrix,responseVector];
}

const [X,y] = getDataset();

const lr = new LogisticRegression({
    learning_rate: Math.pow(10,-3)
});

lr.fit(X ,y);

fs.writeFileSync('./../game/src/model.json',JSON.stringify(lr.toJSON()));
