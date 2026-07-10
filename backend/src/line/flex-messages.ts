// LINE Flex Message builders — ย้ายมาจาก routes/line.ts ตามเดิมทุกตัวอักษร
import { messagingApi } from '@line/bot-sdk';

const LIFF_ID = process.env.LIFF_ID ?? '';

const LIFF_URL = LIFF_ID ? `https://liff.line.me/${LIFF_ID}` : 'https://carekan.app/search';

function bookingFlexMessage(): messagingApi.Message {
  return {
    type: 'flex',
    altText: 'จองคิวออนไลน์ผ่าน CareKan — กดเพื่อเปิด',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1b4d8c',
        paddingTop: '20px',
        paddingBottom: '20px',
        paddingStart: '20px',
        paddingEnd: '20px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#f9c80e',
                width: '36px',
                height: '36px',
                cornerRadius: '6px',
                justifyContent: 'center',
                alignItems: 'center',
                contents: [
                  { type: 'text', text: 'C', color: '#1b4d8c', weight: 'bold', size: 'lg', align: 'center' },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                paddingStart: '10px',
                justifyContent: 'center',
                contents: [
                  { type: 'text', text: 'CareKan', color: '#ffffff', weight: 'bold', size: 'lg' },
                  { type: 'text', text: 'ระบบจองคิวโรงพยาบาลรัฐ', color: '#a8c4e8', size: 'xs' },
                ],
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#143b6e',
            cornerRadius: '8px',
            paddingAll: '12px',
            margin: '14px',
            contents: [
              {
                type: 'text',
                text: '🏥 ไม่ต้องตื่นตี 5 รอคิว',
                color: '#ffffff',
                weight: 'bold',
                size: 'md',
              },
              {
                type: 'text',
                text: 'จองคิวล่วงหน้าได้ทุกที่ ทุกเวลา ฟรี',
                color: '#a8c4e8',
                size: 'sm',
                margin: '4px',
              },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#e7eef7',
                cornerRadius: '8px',
                paddingAll: '10px',
                contents: [
                  { type: 'text', text: '45', color: '#1b4d8c', weight: 'bold', size: 'xl', align: 'center' },
                  { type: 'text', text: 'โรงพยาบาล', color: '#555555', size: 'xs', align: 'center' },
                ],
              },
              { type: 'box', layout: 'vertical', width: '8px', contents: [] },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#e7eef7',
                cornerRadius: '8px',
                paddingAll: '10px',
                contents: [
                  { type: 'text', text: '50+', color: '#1b4d8c', weight: 'bold', size: 'xl', align: 'center' },
                  { type: 'text', text: 'คลินิก', color: '#555555', size: 'xs', align: 'center' },
                ],
              },
              { type: 'box', layout: 'vertical', width: '8px', contents: [] },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#e7eef7',
                cornerRadius: '8px',
                paddingAll: '10px',
                contents: [
                  { type: 'text', text: 'ฟรี', color: '#1b4d8c', weight: 'bold', size: 'xl', align: 'center' },
                  { type: 'text', text: 'ไม่มีค่าบริการ', color: '#555555', size: 'xs', align: 'center' },
                ],
              },
            ],
          },
          { type: 'separator', color: '#e5e7eb' },
          {
            type: 'text',
            text: 'วิธีจองใน 3 ขั้นตอน',
            weight: 'bold',
            size: 'sm',
            color: '#1b4d8c',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                  { type: 'text', text: '①', color: '#f9c80e', weight: 'bold', size: 'sm', flex: 0 },
                  { type: 'text', text: 'เลือกโรงพยาบาลและคลินิก', color: '#333333', size: 'sm', wrap: true },
                ],
              },
              {
                type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                  { type: 'text', text: '②', color: '#f9c80e', weight: 'bold', size: 'sm', flex: 0 },
                  { type: 'text', text: 'เลือกวันและช่วงเวลาที่สะดวก', color: '#333333', size: 'sm', wrap: true },
                ],
              },
              {
                type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                  { type: 'text', text: '③', color: '#f9c80e', weight: 'bold', size: 'sm', flex: 0 },
                  { type: 'text', text: 'รับหมายเลขคิวทันที ไม่ต้องรอ', color: '#333333', size: 'sm', wrap: true },
                ],
              },
            ],
          },
          { type: 'separator', color: '#e5e7eb' },
          {
            type: 'text',
            text: 'รองรับสิทธิ์: บัตรทอง · ประกันสังคม · ข้าราชการ · ชำระเอง',
            color: '#777777',
            size: 'xs',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '📅  จองคิวเลย', uri: LIFF_URL },
            style: 'primary',
            color: '#1b4d8c',
            height: 'sm',
          },
          {
            type: 'button',
            action: { type: 'uri', label: 'ดูรายชื่อโรงพยาบาล', uri: 'https://carekan.app/search' },
            style: 'link',
            color: '#1b4d8c',
            height: 'sm',
          },
        ],
      },
    },
  } as messagingApi.Message;
}

function dot(color: string) {
  return {
    type: 'box' as const,
    layout: 'vertical' as const,
    width: '10px',
    height: '10px',
    cornerRadius: '5px',
    backgroundColor: color,
    contents: [],
  };
}

function iconBox(letter: string, bg: string) {
  return {
    type: 'box' as const,
    layout: 'vertical' as const,
    width: '32px',
    height: '32px',
    cornerRadius: '6px',
    backgroundColor: bg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    contents: [{ type: 'text' as const, text: letter, color: '#ffffff', weight: 'bold' as const, size: 'sm' as const, align: 'center' as const }],
  };
}

function cardHeader(title: string, subtitle: string, accentColor = '#1b4d8c') {
  return {
    type: 'box' as const,
    layout: 'vertical' as const,
    backgroundColor: accentColor,
    paddingAll: '18px',
    contents: [
      { type: 'text' as const, text: title, color: '#ffffff', weight: 'bold' as const, size: 'lg' as const },
      { type: 'text' as const, text: subtitle, color: '#a8c4e8', size: 'xs' as const, margin: '4px' as const },
    ],
  };
}

function hospitalFlexMessage(): messagingApi.Message {
  const hospitals = [
    'โรงพยาบาลกลาง',
    'โรงพยาบาลตากสิน',
    'โรงพยาบาลเจริญกรุงประชารักษ์',
    'โรงพยาบาลสิรินธร',
    'โรงพยาบาลลาดกระบัง กทม.',
  ];

  return {
    type: 'flex',
    altText: 'โรงพยาบาลในเครือ CareKan 45 แห่ง',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: cardHeader('โรงพยาบาลในเครือ CareKan', '45 แห่ง • สำนักการแพทย์ กทม.'),
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: [
          ...hospitals.map((name) => ({
            type: 'box' as const,
            layout: 'horizontal' as const,
            alignItems: 'center' as const,
            spacing: 'md' as const,
            paddingAll: '10px' as const,
            backgroundColor: '#f8fafc',
            cornerRadius: '6px',
            contents: [
              dot('#1b4d8c'),
              { type: 'text' as const, text: name, size: 'sm' as const, color: '#1f2937', flex: 1 },
            ],
          })),
          {
            type: 'box',
            layout: 'horizontal',
            alignItems: 'center',
            spacing: 'md',
            paddingAll: '10px',
            contents: [
              dot('#c8ccd2'),
              { type: 'text' as const, text: 'และอีก 40 แห่งทั่ว กทม.', size: 'sm' as const, color: '#6b7280', flex: 1 },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: 'ค้นหาโรงพยาบาลทั้งหมด', uri: `https://liff.line.me/${LIFF_ID || ''}` },
            style: 'primary',
            color: '#1b4d8c',
            height: 'sm',
          },
        ],
      },
    },
  } as messagingApi.Message;
}

function rightsFlexMessage(): messagingApi.Message {
  const rights = [
    { label: 'บัตรทอง', desc: 'UC / สปสช. — ใช้สิทธิ์ รพ. ตามสิทธิ์', color: '#16a34a' },
    { label: 'ประกันสังคม', desc: 'SSO — ใช้ได้ที่ รพ. ตามสิทธิ์', color: '#0284c7' },
    { label: 'ข้าราชการ', desc: 'CSMBS — กรมบัญชีกลาง', color: '#7c3aed' },
    { label: 'ชำระเอง', desc: 'Self Pay — ไม่ใช้สิทธิ์ใด', color: '#d97706' },
  ];

  const colors: Record<string, string> = {
    '#16a34a': '#dcfce7',
    '#0284c7': '#e0f2fe',
    '#7c3aed': '#ede9fe',
    '#d97706': '#fef3c7',
  };

  return {
    type: 'flex',
    altText: 'สิทธิการรักษาที่รองรับ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: cardHeader('สิทธิการรักษาที่รองรับ', 'CareKan รองรับสิทธิ์ครบทุกประเภท'),
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: [
          ...rights.map((r) => ({
            type: 'box' as const,
            layout: 'horizontal' as const,
            alignItems: 'center' as const,
            spacing: 'md' as const,
            paddingAll: '12px' as const,
            backgroundColor: colors[r.color] ?? '#f8fafc',
            cornerRadius: '8px' as const,
            contents: [
              iconBox(r.label.slice(0, 1), r.color),
              {
                type: 'box' as const,
                layout: 'vertical' as const,
                flex: 1,
                contents: [
                  { type: 'text' as const, text: r.label, weight: 'bold' as const, size: 'sm' as const, color: '#1f2937' },
                  { type: 'text' as const, text: r.desc, size: 'xs' as const, color: '#6b7280', wrap: true },
                ],
              },
            ],
          })),
          { type: 'separator' as const, color: '#e5e7eb', margin: 'md' as const },
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            alignItems: 'center',
            contents: [
              dot('#6b7280'),
              { type: 'text' as const, text: 'ไม่แน่ใจสิทธิ์? โทรสอบถาม สปสช. ได้ที่ 1330', size: 'xs' as const, color: '#6b7280', wrap: true, flex: 1 },
            ],
          },
        ],
      },
    },
  } as messagingApi.Message;
}

function contactFlexMessage(): messagingApi.Message {
  const channels = [
    { icon: 'W', bg: '#1b4d8c', label: 'เว็บไซต์', value: 'carekan.app', uri: 'https://carekan.app' },
    { icon: 'L', bg: '#06C755', label: 'LINE OA', value: '@174efayk', uri: 'https://line.me/R/ti/p/@174efayk' },
    { icon: 'T', bg: '#dc2626', label: 'สายด่วน กทม.', value: '1555  (24 ชม.)', uri: 'tel:1555' },
  ];

  return {
    type: 'flex',
    altText: 'ช่องทางติดต่อ CareKan',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: cardHeader('ช่องทางติดต่อ', 'CareKan พร้อมช่วยเหลือตลอดเวลา'),
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: channels.map((c) => ({
          type: 'box' as const,
          layout: 'horizontal' as const,
          alignItems: 'center' as const,
          spacing: 'md' as const,
          paddingAll: '12px' as const,
          backgroundColor: '#f8fafc',
          cornerRadius: '8px' as const,
          action: { type: 'uri' as const, label: c.label, uri: c.uri },
          contents: [
            iconBox(c.icon, c.bg),
            {
              type: 'box' as const,
              layout: 'vertical' as const,
              flex: 1,
              contents: [
                { type: 'text' as const, text: c.label, weight: 'bold' as const, size: 'sm' as const, color: '#1f2937' },
                { type: 'text' as const, text: c.value, size: 'sm' as const, color: '#4b5563' },
              ],
            },
            { type: 'text' as const, text: '›', size: 'lg' as const, color: '#9ca3af', align: 'end' as const },
          ],
        })),
      },
    },
  } as messagingApi.Message;
}

function helpFlexMessage(): messagingApi.Message {
  const commands = [
    { icon: 'จ', bg: '#1b4d8c', cmd: 'จอง', desc: 'เปิดหน้าจองคิวออนไลน์' },
    { icon: 'ร', bg: '#0284c7', cmd: 'โรงพยาบาล', desc: 'รายชื่อ รพ. ทั้ง 45 แห่ง' },
    { icon: 'ส', bg: '#7c3aed', cmd: 'สิทธิ', desc: 'ตรวจสอบสิทธิ์การรักษา' },
    { icon: 'ต', bg: '#dc2626', cmd: 'ติดต่อ', desc: 'เบอร์โทรและช่องทางติดต่อ' },
  ];

  return {
    type: 'flex',
    altText: 'คู่มือใช้งาน CareKan Bot',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: cardHeader('คู่มือใช้งาน CareKan Bot', 'พิมพ์คำสั่งด้านล่างได้เลยครับ'),
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: commands.map((c) => ({
          type: 'box' as const,
          layout: 'horizontal' as const,
          alignItems: 'center' as const,
          spacing: 'md' as const,
          paddingAll: '12px' as const,
          backgroundColor: '#f8fafc',
          cornerRadius: '8px' as const,
          contents: [
            iconBox(c.icon, c.bg),
            {
              type: 'box' as const,
              layout: 'vertical' as const,
              flex: 1,
              contents: [
                {
                  type: 'box' as const,
                  layout: 'horizontal' as const,
                  contents: [
                    {
                      type: 'box' as const,
                      layout: 'vertical' as const,
                      backgroundColor: c.bg,
                      cornerRadius: '4px' as const,
                      paddingStart: '8px' as const,
                      paddingEnd: '8px' as const,
                      paddingTop: '2px' as const,
                      paddingBottom: '2px' as const,
                      flex: 0,
                      contents: [{ type: 'text' as const, text: `"${c.cmd}"`, color: '#ffffff', size: 'xs' as const, weight: 'bold' as const }],
                    },
                  ],
                },
                { type: 'text' as const, text: c.desc, size: 'xs' as const, color: '#6b7280', margin: '4px' as const },
              ],
            },
          ],
        })),
      },
    },
  } as messagingApi.Message;
}

export function buildMessages(userText: string): messagingApi.Message[] {
  const t = userText.trim().toLowerCase();

  if (/สวัสดี|hello|hi|หวัดดี/.test(t)) {
    return [
      {
        type: 'text',
        text: [
          'สวัสดีครับ 👋 ยินดีต้อนรับสู่ CareKan',
          '',
          '🏥 บริการจองคิวโรงพยาบาลรัฐ กทม. ออนไลน์',
          'ครอบคลุม 45 แห่ง ในเครือสำนักการแพทย์ กทม.',
          'ไม่ต้องตื่นตี 5 รอคิว • บริการฟรี ไม่มีค่าใช้จ่าย',
          '',
          '──────────────────',
          '📋 พิมพ์คำสั่งเหล่านี้ได้เลย:',
          '',
          '🗓 "จอง" → เปิดหน้าจองคิวออนไลน์',
          '🏥 "โรงพยาบาล" → รายชื่อ รพ. ที่รองรับ',
          '📄 "สิทธิ" → สิทธิการรักษาที่รองรับ',
          '📞 "ติดต่อ" → ช่องทางติดต่อและสายด่วน',
          '❓ "ช่วย" → ดูคำสั่งทั้งหมด',
        ].join('\n'),
      },
    ];
  }

  if (/จอง|book|คิว/.test(t)) {
    return [bookingFlexMessage()];
  }

  if (/โรงพยาบาล|รพ|hospital/.test(t)) {
    return [hospitalFlexMessage()];
  }

  if (/สิทธิ|uc|สปสช|ประกัน|ข้าราชการ/.test(t)) {
    return [rightsFlexMessage()];
  }

  if (/ติดต่อ|contact|โทร|เบอร์|phone/.test(t)) {
    return [contactFlexMessage()];
  }

  if (/ช่วย|help|คำสั่ง|menu/.test(t)) {
    return [helpFlexMessage()];
  }

  return [
    {
      type: 'text',
      text: [
        'ขอบคุณที่ติดต่อ CareKan ครับ 🙏',
        '',
        'ขออภัย ยังไม่เข้าใจคำสั่งนี้',
        'ลองพิมพ์ "ช่วย" เพื่อดูคำสั่งที่ใช้ได้',
        'หรือโทรสายด่วน ☎️ 1555 ได้ตลอด 24 ชม.',
      ].join('\n'),
    },
  ];
}
