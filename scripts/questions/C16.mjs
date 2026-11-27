// C16 外貨建取引 の問題(12問)
// 仕訳9問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 外貨建の営業取引、決済・決算時の換算(貨幣項目だけ)、前払金・前受金、為替予約の振当処理(差額は期間配分しない)。
// 外貨建の財務活動・為替予約の独立処理は1級なので扱わない。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C16';
const usd = (n) => `$${n.toLocaleString('en-US')}`;

export default function build() {
  const questions = [];

  // 1〜2. 輸入(掛け)→ 決済
  const buyUsd = 3000;
  const buyRate = 140;
  const buyYen = step(`仕入の額(${usd(buyUsd)} × ¥${buyRate})`, 'mul', [buyUsd, buyRate]);
  questions.push(
    journalQ({
      id: 'C16-001',
      topic: T,
      difficulty: 1,
      prompt: `アメリカの会社から商品 ${usd(buyUsd)} を掛けで仕入れた。この日の為替相場は $1 = ¥${buyRate}。`,
      choices: ['仕入', '買掛金', '為替差損益', '前払金', '未払金', '売掛金'],
      debit: [line('仕入', buyYen.value)],
      credit: [line('買掛金', buyYen.value)],
      calc: [buyYen],
      explanation: `外貨の取引は、**取引した日の相場** で円に直す。${usd(buyUsd)} × ¥${buyRate} = ${yen(buyYen.value)}。`,
      mistakes: [
        {
          entry: { debit: [line('仕入', buyUsd)], credit: [line('買掛金', buyUsd)] },
          why: 'ドルの数字のまま記録しない。取引した日の相場で円に直す。',
        },
      ],
      ref: { topic: T, anchor: 'record' },
    }),
  );
  {
    const payRate = 143;
    const paid = step(`支払った円(${usd(buyUsd)} × ¥${payRate})`, 'mul', [buyUsd, payRate]);
    const loss = step('為替差損(支払った円 − 買掛金の帳簿の額)', 'sub', [paid.value, buyYen.value]);
    questions.push(
      journalQ({
        id: 'C16-002',
        topic: T,
        difficulty: 2,
        prompt: `仕入れたときに $1 = ¥${buyRate} で記録した買掛金 ${usd(buyUsd)} を、普通預金口座から支払った。この日の為替相場は $1 = ¥${payRate}。`,
        choices: ['買掛金', '為替差損益', '普通預金', '仕入', '支払手数料', '雑損'],
        debit: [line('買掛金', buyYen.value), line('為替差損益', loss.value)],
        credit: [line('普通預金', paid.value)],
        calc: [buyYen, paid, loss],
        explanation: `買掛金は記録した額 ${yen(buyYen.value)} で減らす。実際に払った ${yen(paid.value)} との差 ${yen(loss.value)} は、円安で払う円が増えた損なので **為替差損益**(借方)。`,
        mistakes: [
          {
            entry: { debit: [line('買掛金', paid.value)], credit: [line('普通預金', paid.value)] },
            why: `買掛金は記録した額 ${yen(buyYen.value)} しかない。払った額との差は為替差損益にする。`,
          },
          {
            entry: { debit: [line('買掛金', buyYen.value), line('仕入', loss.value)], credit: [line('普通預金', paid.value)] },
            why: '相場が動いたことによる差は、仕入の値段ではなく為替差損益。',
          },
        ],
        ref: { topic: T, anchor: 'settle' },
      }),
    );
  }

  // 3. 前受金がある輸出
  {
    const totalUsd = 2500;
    const advUsd = 500;
    const advRate = 145;
    const saleRate = 148;
    const advYen = step(`契約負債(${usd(advUsd)} × 受け取った日の¥${advRate})`, 'mul', [advUsd, advRate]);
    const restUsd = step('残りのドル(代金 − 手付金)', 'sub', [totalUsd, advUsd]);
    const arYen = step(`売掛金(残りのドル × 売上の日の¥${saleRate})`, 'mul', [restUsd.value, saleRate]);
    const sales = step('売上(契約負債の額 + 売掛金)', 'add', [advYen.value, arYen.value]);
    const wrongAll = step(`誤答: 代金の全額を売上の日の相場で換算`, 'mul', [totalUsd, saleRate]);
    const wrongRev = step('誤答: 売上を全額で換算したときの売掛金(売上 − 契約負債)', 'sub', [wrongAll.value, advYen.value]);
    questions.push(
      journalQ({
        id: 'C16-003',
        topic: T,
        difficulty: 3,
        prompt: `アメリカの会社に商品 ${usd(totalUsd)} を輸出する契約をし、手付金 ${usd(advUsd)} を受け取っていた(受け取った日の相場 $1 = ¥${advRate}、契約負債で処理済み)。本日、商品を発送し、残りは掛けとした(出荷基準)。本日の為替相場は $1 = ¥${saleRate}。`,
        choices: ['契約負債', '売掛金', '売上', '為替差損益', '前払金', '普通預金'],
        debit: [line('契約負債', advYen.value), line('売掛金', arYen.value)],
        credit: [line('売上', sales.value)],
        calc: [advYen, restUsd, arYen, sales],
        explanation: `手付金の分は、受け取ったときの額 ${yen(advYen.value)} のまま契約負債を取り崩す。残りの ${usd(restUsd.value)} は本日の相場で ${yen(arYen.value)}。売上は合計の ${yen(sales.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('契約負債', advYen.value), line('売掛金', wrongRev.value)], credit: [line('売上', wrongAll.value)] },
            why: '手付金の分は、受け取った日の相場の額のまま。代金の全額を本日の相場で換算しない。',
            calc: [wrongAll, wrongRev],
          },
        ],
        ref: { topic: T, anchor: 'advance' },
      }),
    );
  }

  // 4. 決算: 売掛金の換算
  {
    const arUsd = 2000;
    const histRate = 146;
    const closeRate = 150;
    const book = step(`帳簿の額(${usd(arUsd)} × ¥${histRate})`, 'mul', [arUsd, histRate]);
    const now = step(`決算日の額(${usd(arUsd)} × ¥${closeRate})`, 'mul', [arUsd, closeRate]);
    const gain = step('為替差益(決算日の額 − 帳簿の額)', 'sub', [now.value, book.value]);
    questions.push(
      journalQ({
        id: 'C16-004',
        topic: T,
        difficulty: 2,
        prompt: `決算日に、売掛金 ${usd(arUsd)}(売り上げた日の相場 $1 = ¥${histRate} で記録)を換算し直す。決算日の為替相場は $1 = ¥${closeRate}。`,
        choices: ['売掛金', '為替差損益', '売上', '買掛金', '貸倒引当金', '普通預金'],
        debit: [line('売掛金', gain.value)],
        credit: [line('為替差損益', gain.value)],
        calc: [book, now, gain],
        explanation: `売掛金は貨幣項目なので、決算日の相場で換算し直す。${yen(book.value)} → ${yen(now.value)} に増えるので、差額 ${yen(gain.value)} は為替差益(**為替差損益** の貸方)。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', gain.value)], credit: [line('売上', gain.value)] },
            why: '相場が動いたことによる差は、売上ではなく為替差損益。',
          },
          {
            entry: { debit: [line('為替差損益', gain.value)], credit: [line('売掛金', gain.value)] },
            why: '円安で、ドルでもらう売掛金の円の額は増える。売掛金は借方、為替差損益は貸方(差益)。',
          },
        ],
        ref: { topic: T, anchor: 'closing' },
      }),
    );
  }

  // 5. 決算: 買掛金の換算
  {
    const apUsd = 5000;
    const histRate = 142;
    const closeRate = 150;
    const book = step(`帳簿の額(${usd(apUsd)} × ¥${histRate})`, 'mul', [apUsd, histRate]);
    const now = step(`決算日の額(${usd(apUsd)} × ¥${closeRate})`, 'mul', [apUsd, closeRate]);
    const loss = step('為替差損(決算日の額 − 帳簿の額)', 'sub', [now.value, book.value]);
    questions.push(
      journalQ({
        id: 'C16-005',
        topic: T,
        difficulty: 2,
        prompt: `決算日に、買掛金 ${usd(apUsd)}(仕入れた日の相場 $1 = ¥${histRate} で記録)を換算し直す。決算日の為替相場は $1 = ¥${closeRate}。`,
        choices: ['為替差損益', '買掛金', '仕入', '売掛金', '未払金', '普通預金'],
        debit: [line('為替差損益', loss.value)],
        credit: [line('買掛金', loss.value)],
        calc: [book, now, loss],
        explanation: `買掛金も貨幣項目。決算日の相場で ${yen(now.value)} に増える(払う円が増える)ので、差額 ${yen(loss.value)} は為替差損(**為替差損益** の借方)。`,
        mistakes: [
          {
            entry: { debit: [line('買掛金', loss.value)], credit: [line('為替差損益', loss.value)] },
            why: '円安で、ドルで払う買掛金の円の額は増える。買掛金は貸方(増加)、為替差損益は借方(差損)。',
          },
        ],
        ref: { topic: T, anchor: 'closing' },
      }),
    );
  }

  // 6. 換算し直さないもの(選択)
  questions.push(
    choiceQ({
      id: 'C16-006',
      topic: T,
      difficulty: 2,
      prompt: '外貨建の次の項目のうち、決算日の為替相場で換算し直さないものはどれか。',
      options: ['売掛金', '買掛金', '前払金', '外貨の普通預金'],
      answer: 2,
      explanation: '決算で換算し直すのは、お金で決済される **貨幣項目**(売掛金・買掛金・外貨の預金)。前払金は商品を受け取ることで決済されるので、換算し直さない。',
      mistakes: [
        { option: 0, why: '売掛金はお金で受け取るので貨幣項目。決算日の相場で換算し直す。' },
        { option: 1, why: '買掛金はお金で払うので貨幣項目。決算日の相場で換算し直す。' },
        { option: 3, why: '外貨の預金はお金そのもの。決算日の相場で換算し直す。' },
      ],
      ref: { topic: T, anchor: 'closing' },
    }),
  );

  // 7. 決算の為替差損益の合計(数値)
  {
    const arUsd = 1000;
    const arRate = 140;
    const apUsd = 3000;
    const apRate = 138;
    const cr = 145;
    const arBook = step('売掛金の帳簿の額', 'mul', [arUsd, arRate]);
    const arNow = step('売掛金の決算日の額', 'mul', [arUsd, cr]);
    const arGain = step('売掛金の為替差益', 'sub', [arNow.value, arBook.value]);
    const apBook = step('買掛金の帳簿の額', 'mul', [apUsd, apRate]);
    const apNow = step('買掛金の決算日の額', 'mul', [apUsd, cr]);
    const apLoss = step('買掛金の為替差損', 'sub', [apNow.value, apBook.value]);
    const net = step('差し引きの為替差損(差損 − 差益)', 'sub', [apLoss.value, arGain.value]);
    const both = step('誤答: 差損と差益を足した額', 'add', [apLoss.value, arGain.value]);
    questions.push(
      numericQ({
        id: 'C16-007',
        topic: T,
        difficulty: 3,
        prompt: `決算日に、売掛金 ${usd(arUsd)}($1 = ¥${arRate} で記録)と買掛金 ${usd(apUsd)}($1 = ¥${apRate} で記録)を換算し直す。決算日の為替相場は $1 = ¥${cr}。この換算で生じる為替差損益は、差し引きでいくらの損か(損の額を答える)。`,
        answer: net.value,
        calc: [arBook, arNow, arGain, apBook, apNow, apLoss, net],
        explanation: `売掛金は ${yen(arGain.value)} の差益、買掛金は ${yen(apLoss.value)} の差損。差し引きで ${yen(net.value)} の為替差損。`,
        mistakes: [
          { value: both.value, calc: [both], why: '売掛金の差益と買掛金の差損は、向きが逆。足さずに差し引く。' },
          { value: apLoss.value, calc: [apLoss], why: '売掛金の換算で生じる差益も合わせて、差し引きで考える。' },
        ],
        ref: { topic: T, anchor: 'gain-loss' },
      }),
    );
  }

  // 8. 為替予約(取引の前)
  {
    const saleUsd = 4000;
    const spot = 148;
    const fwd = 146;
    const amt = step(`予約のレートの額(${usd(saleUsd)} × ¥${fwd})`, 'mul', [saleUsd, fwd]);
    const wrong = step(`誤答: その日の相場の額(${usd(saleUsd)} × ¥${spot})`, 'mul', [saleUsd, spot]);
    questions.push(
      journalQ({
        id: 'C16-008',
        topic: T,
        difficulty: 2,
        prompt: `アメリカの会社に商品 ${usd(saleUsd)} を掛けで売り上げた。この日の為替相場は $1 = ¥${spot}。売り上げる前に、$1 = ¥${fwd} でドルを売る為替予約をしている(振当処理)。`,
        choices: ['売掛金', '売上', '為替差損益', '前受金', '普通預金', '契約資産'],
        debit: [line('売掛金', amt.value)],
        credit: [line('売上', amt.value)],
        calc: [amt],
        explanation: `為替予約で受け取る円の額が決まっているので、売掛金も売上も **予約のレート** で記録する。${usd(saleUsd)} × ¥${fwd} = ${yen(amt.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', wrong.value)], credit: [line('売上', wrong.value)] },
            why: '取引の前に為替予約をしているので、その日の相場ではなく予約のレートで記録する。',
            calc: [wrong],
          },
        ],
        ref: { topic: T, anchor: 'forward-before' },
      }),
    );
  }

  // 9〜10. 為替予約(取引のあと)→ 決済
  const apUsd2 = 2000;
  const histRate2 = 140;
  const fwd2 = 144;
  const book2 = step(`買掛金の帳簿の額(${usd(apUsd2)} × ¥${histRate2})`, 'mul', [apUsd2, histRate2]);
  const fixed2 = step(`予約のレートの額(${usd(apUsd2)} × ¥${fwd2})`, 'mul', [apUsd2, fwd2]);
  {
    const diff = step('差額(予約のレートの額 − 帳簿の額)', 'sub', [fixed2.value, book2.value]);
    questions.push(
      journalQ({
        id: 'C16-009',
        topic: T,
        difficulty: 3,
        prompt: `買掛金 ${usd(apUsd2)}(仕入れた日の相場 $1 = ¥${histRate2} で記録)について、本日、$1 = ¥${fwd2} でドルを買う為替予約をした(振当処理)。予約による差額は、当期の損益として処理する。`,
        choices: ['為替差損益', '買掛金', '仕入', '前払費用', '普通預金', '未払金'],
        debit: [line('為替差損益', diff.value)],
        credit: [line('買掛金', diff.value)],
        calc: [book2, fixed2, diff],
        explanation: `買掛金を予約のレートの額 ${yen(fixed2.value)} に直す。増えた ${yen(diff.value)} は **為替差損益**(2級では期間に配分しない)。`,
        mistakes: [
          {
            entry: { debit: [line('仕入', diff.value)], credit: [line('買掛金', diff.value)] },
            why: '予約による差額は、仕入の値段ではなく為替差損益。',
          },
          {
            entry: { debit: [line('前払費用', diff.value)], credit: [line('買掛金', diff.value)] },
            why: '2級では、予約による差額を期間に配分しない。全部その期の為替差損益にする。',
          },
        ],
        ref: { topic: T, anchor: 'forward-after' },
      }),
    );
  }
  {
    const spot = 147;
    const wrongPaid = step(`誤答: その日の相場で払った額(${usd(apUsd2)} × ¥${spot})`, 'mul', [apUsd2, spot]);
    const wrongLoss = step('誤答: その差額', 'sub', [wrongPaid.value, fixed2.value]);
    questions.push(
      journalQ({
        id: 'C16-010',
        topic: T,
        difficulty: 2,
        prompt: `$1 = ¥${fwd2} の為替予約(振当処理)により ${yen(fixed2.value)} で記録している買掛金 ${usd(apUsd2)} を、本日、普通預金口座から支払った。本日の為替相場は $1 = ¥${spot}。`,
        choices: ['買掛金', '普通預金', '為替差損益', '仕入', '未払金', '前払金'],
        debit: [line('買掛金', fixed2.value)],
        credit: [line('普通預金', fixed2.value)],
        calc: [fixed2],
        explanation: `為替予約で、払う円の額は ${yen(fixed2.value)} に決まっている。その日の相場は関係なく、為替差損益は出ない。`,
        mistakes: [
          {
            entry: { debit: [line('買掛金', fixed2.value), line('為替差損益', wrongLoss.value)], credit: [line('普通預金', wrongPaid.value)] },
            why: '為替予約をしているので、払うのは予約のレートの額。その日の相場で払わない。',
            calc: [wrongPaid, wrongLoss],
          },
        ],
        ref: { topic: T, anchor: 'forward-after' },
      }),
    );
  }

  // 11. 前払金(外貨)
  {
    const advUsd = 1000;
    const rate = 141;
    const amt = step(`前払金(${usd(advUsd)} × ¥${rate})`, 'mul', [advUsd, rate]);
    questions.push(
      journalQ({
        id: 'C16-011',
        topic: T,
        difficulty: 1,
        prompt: `アメリカの会社から商品を輸入する契約をし、手付金 ${usd(advUsd)} を普通預金口座から支払った。この日の為替相場は $1 = ¥${rate}。`,
        choices: ['前払金', '普通預金', '仕入', '為替差損益', '買掛金', '前払費用'],
        debit: [line('前払金', amt.value)],
        credit: [line('普通預金', amt.value)],
        calc: [amt],
        explanation: `商品の代金の前払いは **前払金**。払った日の相場で ${yen(amt.value)}。前払金は、あとで決算日の相場で換算し直さない。`,
        mistakes: [
          {
            entry: { debit: [line('仕入', amt.value)], credit: [line('普通預金', amt.value)] },
            why: 'まだ商品を受け取っていないので、仕入ではない。手付金は前払金。',
          },
        ],
        ref: { topic: T, anchor: 'advance' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C16-012',
      topic: T,
      difficulty: 2,
      prompt: '外貨建取引について、正しいものをすべて選びなさい。',
      options: [
        '外貨建の取引は、取引した日の為替相場で円に換算して記録する',
        '決算では、前払金も決算日の為替相場で換算し直す',
        '為替予約をした売掛金は、予約のレートで記録し、決算で換算し直さない',
        '円安になると、外貨建の買掛金からは為替差益が生じる',
        '2級では、取引のあとで為替予約をしたときの差額を、全部その期の為替差損益にする',
      ],
      answer: [0, 2, 4],
      explanation: '前払金は貨幣項目ではないので換算し直さない。円安では、ドルで払う買掛金の円の額が増えるので為替差損。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '前払金は商品で決済されるので、決算日の相場で換算し直さない。' },
        { options: [0, 2, 3, 4], why: '円安になると、ドルで払う買掛金の円の額は増える。これは為替差損。' },
        { options: [0, 4], why: '為替予約をした売掛金は予約のレートで確定するので、決算で換算し直さない。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'rates' },
    }),
  );

  return { topic: T, questions };
}
