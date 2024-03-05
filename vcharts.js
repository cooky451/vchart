
const key_s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function compressPts(pts)
{
    if (pts.length < 2)
    {
        return "";
    }

    let base = pts[0];
    let distances = [];
    let unique_distances = {};
    let unique_dist_arr = [];

    for (let i = 0; i + 1 < pts.length; ++i)
    {
        const dist = pts[i + 1] - pts[i];
        distances.push(dist);

        if (!(dist in unique_distances))
        {
            unique_dist_arr.push(dist);

            if (unique_dist_arr.length > key_s.length)
            {
                return "";
            }

            unique_distances[dist] = key_s[unique_dist_arr.length - 1];
        }
    }

    let s = "" + base + "," + unique_dist_arr + ",";
    let cur_dist = distances[0];
    let rep_counter = 0;

    for (const dist of distances)
    {
        if (dist == cur_dist)
        {
            rep_counter += 1;
        }
        else
        {
            if (rep_counter > 1)
            {
                s += "" + rep_counter + unique_distances[cur_dist];
            }
            else
            {
                s += "" + unique_distances[cur_dist];
            }
            
            rep_counter = 1;
            cur_dist = dist;
        }
    }

    if (rep_counter > 1)
    {
        s += "" + rep_counter + unique_distances[cur_dist];
    }
    else
    {
        s += "" + unique_distances[cur_dist];
    }

    console.log(s);

    return s;
}

function decompressPts(s)
{
    s = s.split(',');

    if (s.length < 3)
    {
        return [];
    }

    let base = parseInt(s[0]);
    let distances = [];

    for (let i = 1; i + 1 < s.length; ++i)
    {
        distances.push(s[i]);
    }

    let key_dict = {};

    for (let i = 0; i < key_s.length; ++i)
    {
        key_dict[key_s[i]] = i;
    }

    const matches = 
        [...s[s.length - 1].matchAll(/([0-9]{0,5})([a-zA-Z]{1})/gm)];

    console.log(matches);

    let pts = "" + base + "\r\n";

    for (const m of matches)
    {
        let reps = 1;

        if (m[1].length > 0)
        {
            reps = parseInt(m[1]);
        }

        while (reps--)
        {
            base += parseInt(distances[key_dict[m[2]]]);
            pts += base + "\r\n";
        }
    }

    return pts;
}

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

function getMinMaxDif(pts)
{
    let min = 99999;
    let max = 0;

    for (let i = 0; i + 1 < pts.length; ++i)
    {
        const dif = pts[i + 1] - pts[i];

        if (dif < min)
        {
            min = dif;
        }

        if (dif > max)
        {
            max = dif;
        }
    }

    return {
        "min" : min,
        "max" : max
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

const input_tbn = document.getElementById("input-tbn");
const input_fps = document.getElementById("input-framerate");
const input_pts = document.getElementById("input-pts");
const input_sharelink = document.getElementById("input-sharelink");

function updateCharts()
{
    const pts = input_pts.value.split(
        /\s+/).map((v) => parseInt(v)).filter(
            (v) => Number.isInteger(v)).sort((a, b) => a - b);

    const tbn = input_tbn.value;
    const framerate = input_fps.value;

    const framedata = generateData(pts, tbn, framerate);

    input_sharelink.value = 
        window.location.href.split('?')[0] + 
        "?tbn=" + tbn + 
        "&fps=" + framerate + 
        "&pts=" + compressPts(pts);

    if (chart)
    {
        chart.destroy();
    }

    chart = makeChart(
        document.getElementById('canvas-framechart'), 
        framedata.times, framedata.distances);

    const real_framerate = (pts.length - 1) / (pts[pts.length - 1] / tbn);
    const minmax = getMinMaxDif(pts);

    const p = document.getElementById("p-ideal-framerate");

    p.innerHTML = "Ideal Framerate: " + real_framerate + 
        "<br>Speed to reach target framerate: " + 
        framerate / real_framerate * 100 + "%" + 
        "<br>Min: " + minmax.min + ", " + 
        minmax.min / tbn * 1000 + " ms, " +
        1 / (minmax.min / tbn) + " FPS" +
        "<br>Max: " + minmax.max + ", " + 
        minmax.max / tbn * 1000 + " ms, " +
        1 / (minmax.max / tbn) + " FPS";

    const adjusted_data = generateData(pts, tbn, real_framerate);

    if (adjusted_chart)
    {
        adjusted_chart.destroy();
    }

    adjusted_chart = makeChart(
        document.getElementById('canvas-adjustedchart'), 
        adjusted_data.times, adjusted_data.distances);
}

const params = new URLSearchParams(window.location.href);

if (params.has('tbn'))
{
    input_tbn.value = params.get('tbn');
}

if (params.has('fps'))
{
    input_fps.value = params.get('fps');
}

if (params.has('pts'))
{
    input_pts.value = decompressPts(params.get('pts'));
}

document.getElementById("input-draw").addEventListener(
    "click", () => updateCharts());
