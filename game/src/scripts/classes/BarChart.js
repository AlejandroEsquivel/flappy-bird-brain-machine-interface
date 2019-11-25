const Chart = require('chart.js');

module.exports = class BarChart {
    constructor(ctx){
        this.ctx = ctx;
        this.chart = new Chart(ctx, {
            type: 'bar',
            options: {
                tooltips: {
                    enabled: false
                }
            },
            data: {
                labels: ["Alpha","Beta"],
                datasets: [
                  {
                    backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
                    maxBarThickness: 200,
                    data: []
                  }
                ]
              },
              options: {
                legend: { display: false },
                title: {
                  display: true,
                  text: 'Bandpower Plot'
                }
            }
        });
    }

    plot(newData) {
        this.chart.data.datasets.forEach((dataset) => {
            dataset.data = newData;
        });
        this.chart.update();
    }

    
}