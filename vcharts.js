
function generateData(pts, tbn, framerate)
{
    let last_frame_i = 0;
    let frame_time = 0;
    let frame_times = [];
    let frame_distances = [];

    while (frame_time <= pts[pts.length - 1] && frame_times.length < 100000)
    {
        let dist = frame_time - pts[last_frame_i];

        while (last_frame_i + 1 < pts.length)
        {
            const nd = frame_time - pts[last_frame_i + 1];

            if (Math.abs(nd) > Math.abs(dist))
            {
                break;
            }

            dist = nd;
            last_frame_i += 1;
        }

        frame_times.push(Math.round(frame_time / tbn * 1000) / 1000);
        frame_distances.push(dist / tbn * 1000);

        frame_time += tbn / framerate;
    }

    return {
        "times": frame_times,
        "distances": frame_distances
    };
}

function makeChart(canvas, times, distances)
{
    const data = {
        labels: times,
        datasets: [{
            label: 'Distance to ideal',
            data: distances,
            fill: false,
            borderColor: 'rgb(50, 50, 250)',
            borderWidth: 1,
            tension: 0
        }]
    };
    
    return new Chart(canvas, {
        type: 'line',
        data: data,
        options: {
            scales: {
                y: {
                    suggestedMin: -10,
                    suggestedMax: 10
                }
            }
        }
    });
}

let chart = null;
let adjusted_chart = null;

function updateCharts()
{
    const pts = document.getElementById("input-pts").value.split(
        /\s+/).map((v) => parseInt(v)).filter(
            (v) => Number.isInteger(v)).sort((a, b) => a - b);

    const tbn = document.getElementById("input-tbn").value;
    const framerate = document.getElementById("input-framerate").value;

    const framedata = generateData(pts, tbn, framerate);

    if (chart)
    {
        chart.destroy();
    }

    chart = makeChart(
        document.getElementById('canvas-framechart'), 
        framedata.times, framedata.distances);

    const real_framerate = (pts.length - 1) / (pts[pts.length - 1] / tbn);

    const p = document.getElementById("p-ideal-framerate");

    p.innerHTML = "Ideal Framerate: " + real_framerate + 
        "<br>Speed to reach target framerate: " + 
        framerate / real_framerate * 100 + "%";

    const adjusted_data = generateData(pts, tbn, real_framerate);

    if (adjusted_chart)
    {
        adjusted_chart.destroy();
    }

    adjusted_chart = makeChart(
        document.getElementById('canvas-adjustedchart'), 
        adjusted_data.times, adjusted_data.distances);
}

document.getElementById("input-draw").addEventListener(
    "click", () => updateCharts());
