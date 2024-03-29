import { Buffer, IRCMessageParsed, MessageParserReturn } from './types';
import { nickFromPrefix } from './common';
import IRCNicksSet from './IRCNicksSet';

type MessageHandler = (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => Buffer;
type MessageHandlers = Record<string, MessageHandler>;

function joinOrPartHandler(functorName: string, networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) {
    const buf = networkBuffers[parsed.params[0].replace('\r\n', '')];
    buf.names[functorName](nickFromPrefix(parsed.prefix));
    return null; // return `buf` here to have joins & parts appear in the channel
}

const MODES_TO_HATS = {
    "+o": "@",
    "-o": "",
    "+v": "+",
    "-v": ""
};

const MESSAGE_HANDLERS: MessageHandlers = {
    privmsg: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        let retBuf;
        if (parsed.prefix && networkBuffers[parsed.params[0]]?.name[0] !== "#" /* should check that this is US */) {
            const pmPartner = nickFromPrefix(parsed.prefix);
            if (!networkBuffers[pmPartner]) {
                networkBuffers[pmPartner] = new Buffer(pmPartner);
            }

            retBuf = networkBuffers[pmPartner];
        }
        else {
            if (!networkBuffers[parsed.params[0]]) {
                networkBuffers[parsed.params[0]] = new Buffer(parsed.params[0]);
            }

            retBuf = networkBuffers[parsed.params[0]];
        }

        return retBuf;
    },
    join: joinOrPartHandler.bind(null, 'add'),
    part: joinOrPartHandler.bind(null, 'delete'),

    quit: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const nick = nickFromPrefix(parsed.prefix);

        Object.entries(networkBuffers).forEach(([channel, buffer]) => {
            if (channel.length > 0) {
                buffer.names.delete(nick);
            }
        });

        return null;
    },

    nick: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const oldNick = nickFromPrefix(parsed.prefix);
        const newNick = parsed.params[0].replace('\r\n', '');

        Object.entries(networkBuffers).forEach(([channel, buffer]) => {
            if (buffer.names.has(oldNick)) {
                const currentHat = buffer.names._getCurrentHat(oldNick);
                buffer.names.delete(oldNick);
                buffer.names.add(`${currentHat}${newNick}`);
            }
        });

        return null;
    },

    mode: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const [channel, newMode, nick] = parsed.params;
        networkBuffers[channel].names.add(`${MODES_TO_HATS[newMode]}${nick.replace("\r\n", "")}`);
        return null;
    }
};

const NUMERIC_HANDLERS: MessageHandlers = {
    353 /*RPL_NAMREPLY*/: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const chanName = parsed.params[2];
        if (!networkBuffers[chanName]) {
            networkBuffers[chanName] = {
                name: chanName,
                buffer: [],
                names: new IRCNicksSet()
            };
        }

        const buf = networkBuffers[chanName];
        buf.names = new IRCNicksSet([
            ...buf.names,
            ...parsed.params[3].split(" ").map((s) => s.replace('\r\n', ''))
        ]);
        return null;
    }
};

export default function (
    networkBuffers: Record<string, Buffer>,
    parsed: IRCMessageParsed
): MessageParserReturn {
    let currentBuffer: Buffer = networkBuffers[""];

    if (MESSAGE_HANDLERS[parsed.command.toLowerCase()]) {
        currentBuffer = MESSAGE_HANDLERS[parsed.command.toLowerCase()](networkBuffers, parsed);
    }
    else {
        const numeric = Number.parseInt(parsed.command);
        if (!Number.isNaN(numeric) && NUMERIC_HANDLERS[parsed.command]) {
            currentBuffer = NUMERIC_HANDLERS[parsed.command](networkBuffers, parsed);
        }
        else {
            console.log('[UNHANDLED]', parsed.command, parsed);
        }
    }

    if (currentBuffer) {
        currentBuffer.buffer.push(parsed);
    }

    return { parsed, currentBuffer };
}