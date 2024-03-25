import { useRef, useEffect } from "react";
import { emit, listen } from '@tauri-apps/api/event';

export interface MBUserInputRaw {
    raw: string;
    command: string;
    args: string[];
    argsStr: string;
};

export default function MessageBox(props) {
    const mbRef = useRef(null);

    listen("nhexchat://servers_and_chans/selected", () => {
        mbRef.current.scrollIntoView({behavior: "smooth", block:"end"});
    });

    return (
        <div id="message_box">
            <div id="message_cont">
                <div id="message_area" ref={mbRef}>
                    {props.lines.map((line, i) => (
                        <>
                        <div id={`mb_line_${i}`}>{line}</div>
                        </>
                    ))}
                </div>
            </div>
            <div id="user_input_cont">
                <input type="text" id="user_input" onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const userInput = e.currentTarget.value;
                        e.currentTarget.value = "";

                        const uiSplit = userInput.split(" ");
                        let command = "privmsg";

                        if (userInput[0] === "/") {
                            command = uiSplit[0].slice(1);
                        }

                        const args = uiSplit.slice((command === "privmsg") ? 0 : 1);
                        emit("nhexchat://user_input/raw", {
                            raw: userInput,
                            command,
                            args,
                            argsStr: args.join(" "),
                        }).catch(console.error);
                    }
                }} />
            </div>
        </div>
    );
}