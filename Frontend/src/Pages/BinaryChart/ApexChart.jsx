// import React from "react";
// import ReactApexChart from "react-apexcharts";
// import dayjs from "dayjs";

// const ApexChart = () => {
//     const [state, setState] = React.useState({
          
//         series: [{
//           name: 'candle',
//           data: [
        
//             {
//               x: new Date(1538874000000),
//               y: [6600.55, 6605, 6589.14, 6593.01]
//             },
//             {
//               x: new Date(1538875800000),
//               y: [6593.15, 6605, 6592, 6603.06]
//             },
//             {
//               x: new Date(1538877600000),
//               y: [6603.07, 6604.5, 6599.09, 6603.89]
//             },
//             {
//               x: new Date(1538879400000),
//               y: [6604.44, 6604.44, 6600, 6603.5]
//             },
//             {
//               x: new Date(1538881200000),
//               y: [6603.5, 6603.99, 6597.5, 6603.86]
//             },
//             {
//               x: new Date(1538883000000),
//               y: [6603.85, 6605, 6600, 6604.07]
//             },
//             {
//               x: new Date(1538884800000),
//               y: [6604.98, 6606, 6604.07, 6606]
//             },
//           ]
//         }],
//         options: {
//           chart: {
//             height: 350,
//             type: 'candlestick',
//           },
//           title: {
//             text: 'CandleStick Chart - Category X-axis',
//             align: 'left'
//           },
//           annotations: {
//             xaxis: [
//               {
//                 x: 'Oct 06 14:00',
//                 borderColor: '#00E396',
//                 label: {
//                   borderColor: '#00E396',
//                   style: {
//                     fontSize: '12px',
//                     color: '#fff',
//                     background: '#00E396'
//                   },
//                   orientation: 'horizontal',
//                   offsetY: 7,
//                   text: 'Annotation Test'
//                 }
//               }
//             ]
//           },
//           tooltip: {
//             enabled: true,
//           },
//           xaxis: {
//             type: 'category',
//             labels: {
//               formatter: function(val) {
//                 return dayjs(val).format('MMM DD HH:mm')
//               }
//             }
//           },
//           yaxis: {
//             tooltip: {
//               enabled: true
//             }
//           }
//         },
      
      
//     });

//   return (
//     <div id="chart">
//       <ReactApexChart
//         options={state.options}
//         series={state.series}
//         type="candlestick"
//         height={350}
//       />
//     </div>
//   );
// };

// export default ApexChart;
