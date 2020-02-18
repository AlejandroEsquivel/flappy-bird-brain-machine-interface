module.exports = (row) => {
    const { alpha, beta, delta, theta, gamma } = row;
    return [
        gamma,
        alpha, 
        beta, 
        delta, 
        theta
    ]
}