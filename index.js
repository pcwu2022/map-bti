/** 
    values: {
        username: string,
        mbti: string
    }
**/

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

(async () => {

    const activateDb = true;

    const MBTI = [
        "ENFJ", "ENFP", "ENTJ", "ENTP",
        "ESFJ", "ESFP", "ESTJ", "ESTP",
        "INFJ", "INFP", "INTJ", "INTP",
        "ISFJ", "ISFP", "ISTJ", "ISTP",
    ];

    // On page load
    let username = localStorage.getItem("mapbti_username");
    let temp_username = "";
    let temp_mbti = "";

    
    const firebaseConfig = {
        apiKey: "AIzaSyBoby19cfXs0TtnFBctpajKaMeMDFloLMA",
        authDomain: "map-bti.firebaseapp.com",
        databaseURL: "https://map-bti-default-rtdb.firebaseio.com",
        projectId: "map-bti",
        storageBucket: "map-bti.firebasestorage.app",
        messagingSenderId: "900784765004",
        appId: "1:900784765004:web:a58c95f8d6e2de387c5ce9",
        measurementId: "G-QX7ME6HN95"
    };
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    
    // Initialize Cytoscape
    const cy = cytoscape({
        container: document.getElementById("cy"),
        elements: [],
        style: [
            {
                selector: 'node',
                style: {
                    'background-image': function(ele){return `img/${ele.data('value.mbti')}.png`},
                    'background-width': '100%',
                    'background-height': '100%',
                    'label': function(ele){return (ele.data('value.username') === username)?"You":ele.data('value.username'); }, // Display the node ID
                    'color': '#000000',
                    'width': function(ele){return Math.log2(ele.degree() + 1)*10;},
                    'height': function(ele){return Math.log2(ele.degree() + 1)*10;},
                    'border-width': function(ele){return (ele.data('value.username') === username)?"3":""; },
                    'border-color': function(ele){return (ele.data('value.username') === username)?"#FF4136":""; },
                    'opacity': '0.6'
                },
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': function(ele){return (ele.data('source') === username || ele.data('target') === username)?"#FF4136":"#999999"; },
                    'target-arrow-color': function(ele){return (ele.data('source') === username || ele.data('target') === username)?"#FF4136":"#999999"; },
                    'target-arrow-shape': 'triangle',
                    'opacity': function(ele){return (ele.data('source') === username || ele.data('target') === username)?"1":"0.5"; },
                },
            },
        ],
    });
    
    let g = new Graph(cy);
    
    const updateLocalGraph = () => new Promise((resolve, reject) => {
        if (!activateDb){
            resolve(false);
            return;
        }
        get(ref(db, 'graph')).then((snapshot) => {
            if (snapshot.exists()) {
                g.fromJSON(snapshot.val());
                g.cytoscapeInit(cy);
                resolve(true);
                console.log("Data loaded in the graph");
                console.log(g.repr());
            } else {
                reject("No data available");
            }
        }).catch((error) => {
            reject("Error reading data: ", error);
        });
    });
    
    const overwriteDatabase = () => new Promise((resolve, reject) => {
        if (!activateDb){
            resolve(false);
            return;
        }
        console.log(g);
        set(ref(db, 'graph'), g.toJSON()).then(() => {
            console.log("Data written successfully");
            resolve(true);
        }).catch((error) => {
            reject("Error writing data: ", error);
        });
    });

    await updateLocalGraph();
    if (!username || username === ""){
        if ((await Swal.fire({
            title: "歡迎使用 Map-BTI！",
            text: "請問你有使用過嗎？",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "有",
            cancelButtonText: "沒有"
        })).value){
            temp_username = (await Swal.fire({
                title: "歡迎回來！",
                text: "請輸入你的使用者名稱",
                icon: "info",
                input: "text",
            })).value;
            while (g.idList.indexOf(temp_username) === -1){
                temp_username = temp_username = (await Swal.fire({
                    title: "該使用者不存在！",
                    text: "請輸入你的使用者名稱",
                    icon: "info",
                    input: "text",
                })).value;
            }
            username = temp_username;
            localStorage.setItem("mapbti_username", username);
        } else {
            temp_username = (await Swal.fire({
                title: "請輸入一個使用者名稱",
                text: "請不要輸入真名",
                icon: "info",
                input: "text",
            })).value;
            while (g.idList.indexOf(temp_username) !== -1){
                temp_username = temp_username = (await Swal.fire({
                    title: "該使用者名稱已經被註冊過了！",
                    text: "請換一個使用者名稱，請不要輸入真名",
                    icon: "info",
                    input: "text",
                })).value;
            }
            if (!(await Swal.fire({
                title: "有測過 MBTI 嗎？",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "有",
                cancelButtonText: "沒有"
            })).value){
                location.href = "https://www.16personalities.com/free-personality-test";
            }
            temp_mbti = (await Swal.fire({
                title: "請輸入你的 MBTI",
                text: "ex: ENFJ, ISTP",
                icon: "info",
                input: "text",
            })).value.toUpperCase();
            while (MBTI.indexOf(temp_mbti) === -1){
                temp_mbti = (await Swal.fire({
                    title: "格式錯誤！",
                    text: "請輸入你的 MBTI（ex: ENFJ, ISTP）",
                    icon: "info",
                    input: "text",
                })).value.toUpperCase();
            }
            await Swal.fire("註冊成功！現在你可以邀請朋友進來了！");

            // insert data
            username = temp_username;
            await updateLocalGraph();
            g.insert(new Node(username, {
                username: username,
                mbti: temp_mbti
            }));
            await overwriteDatabase();
            localStorage.setItem("mapbti_username", username);
        }
    } 

    // create connection
    const connectionButton = document.getElementById("connection");
    connectionButton.addEventListener("click", async () => {
        const link = location.host + "/?inviter=" + username + "&time=" + (new Date()).getTime();
        Swal.fire({
            title: "傳送連結給你的朋友",
            html: `
            你的朋友只要使用了這個連結點開，他們就會獲得一條跟你的連線：<u>${link}</u>
            <button id="clipboard" onclick="((e) => {
                navigator.clipboard.writeText('${link}');
                document.getElementById('clipboard').innerHTML = '已複製✅';
})()">複製到剪貼簿</button>
            `
        })
    });

    // detect inviter
    let searchParams = location.search;
    let index = searchParams.indexOf("?inviter=");
    let indexEnd = searchParams.indexOf("&time=");
    if (index !== -1 && indexEnd !== -1){
        let inviter = searchParams.substring(index + 9, indexEnd);
        g.edgeId(inviter, username);
        await overwriteDatabase();
        g.degreesOfConnection(username);
    }

    const elsRemoved = cy.elements().remove();
    elsRemoved.restore();
    // g.cytoscapeInit(cy); 

    const restart = () => {
        g.insert(new Node("ddm4535", {username: "ddm4534", mbti: "ENFJ"}))
        g.edgeId("ddm4535", "ddm4535");
        overwriteDatabase();
    }
    // restart();
})().then().catch((err) => console.error(err));
