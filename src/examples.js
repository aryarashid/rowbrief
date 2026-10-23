export const EXAMPLES = [
  {id: 'handoff', name: 'A clean handoff', delimiter: ',', text: 'item,owner,notes\r\nField guide,Mina,"Review the opening, then the checklist"\r\nWelcome pack,Noor,"Bring a map\r\nand a pencil"\r\nStation signs,Jules,Ready for review\r\n'},
  {id: 'dialect', name: 'Find the delimiter', delimiter: ';', text: '\ufeffitem;region;notes\r\nWelcome pack;Montréal;Includes a map, pencil and card\r\nField guide;京都;Ready for the morning session\r\nStation signs;São Paulo;Keep the title, subtitle and date\r\n'},
  {id: 'issues', name: 'Locate a broken record', delimiter: ',', text: 'item,owner,status\nField guide,Mina,Ready\nWelcome pack,Noor\nStation signs,Jules,Review,Unexpected extra field\n'},
  {id: 'headers', name: 'Check header names', delimiter: ',', text: 'item,owner,owner,\nField guide,Mina,Noor,Review\nWelcome pack,Jules,Mina,Ready\n'},
  {id: 'quotes', name: 'An unfinished quote', delimiter: ',', text: 'item,owner,notes\nField guide,Mina,Ready\nWelcome pack,Noor,"A note that never closes\nStation signs,Jules,Review\n'}
];
