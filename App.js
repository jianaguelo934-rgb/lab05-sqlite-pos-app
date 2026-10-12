import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Dimensions, FlatList, Modal, PanResponder, RefreshControl, Platform, KeyboardAvoidingView, Image, Share, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Home as HomeIcon, CreditCard as CardIcon, Wallet as WalletIcon, User as UserIcon, ArrowRight, ArrowLeft, Bell as BellIcon, MapPin as PinIcon, Search as SearchIcon, ShieldCheck, Send as SendIcon, Smartphone as PhoneIcon2, Receipt as ReceiptIcon, Zap as ZapIcon, Droplet, Wifi as WifiIcon, Clock, X, Check, Eye, EyeOff, Star as StarIcon, Plus, ChevronRight, Phone as PhoneIcon, SlidersHorizontal, ArrowUpRight, ArrowDownLeft, Gift as GiftIcon, Filter as FilterIcon, MoreVertical, Pencil as PencilIcon, CreditCard, Trash2 } from 'lucide-react-native';
import { initDatabase, getTransactions, addTransaction, deleteTransaction, getTotals, getBalance, adjustBalance, getProfile, saveProfile, getSavings, adjustSavings, getTransactionById, addTransactionGetId, getContacts, addContactGetId, deleteContact, setFrozen, setSpendLimit, spendBlocked, getTodaySpent, clearTransactions, reseedTransactions } from './src/services/db';

/* Figma: Payer - Android 12 Screens vW9DmVR90e0SKg3qoZHMB8 #0:1 — 360x800, Poppins */
const T = {
  bg: '#F6F9FB', white: '#FFFFFF', ink: '#1F2D3A', muted: '#5B6B7A',
  primary: '#AEC4D4', primary2: '#C9D9E5', accent: '#F9E6A8',
  border: '#D7E1E8', border2: '#E6EEF3', border3: '#E3EAF0', border4: '#D8E2EA',
  track: '#E8EEF3', track2: '#E7EEF3',
  green: '#267451', greenBright: '#3FA37A', greenBg: '#EAF7F1',
  red: '#B83B37', redBg: '#FDECEC',
};
const F = { r: 'Poppins_400Regular', m: 'Poppins_500Medium', s: 'Poppins_600SemiBold', b: 'Poppins_700Bold' };
const Stack = createNativeStackNavigator();
const W = Math.min(Dimensions.get('window').width, 430);
const fmt = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

const ICONS = { wallet: WalletIcon, shield: ShieldCheck, send: SendIcon, card: CardIcon, phone: PhoneIcon, receipt: ReceiptIcon, zap: ZapIcon, drop: Droplet, wifi: WifiIcon, user: UserIcon, bell: BellIcon, pin: PinIcon, clock: Clock, search: SearchIcon, back: ArrowLeft, more: MoreVertical, x: X, check: Check, eye: Eye, eyeOff: EyeOff, star: StarIcon, plus: Plus, chev: ChevronRight, arrow: ArrowRight };

function Ic({ n, size = 20, color = T.ink }) {
  const C = ICONS[n] || WalletIcon;
  return <C size={size} color={color} />;
}

function PayerBtn({ label, onPress, accent, small }) {
  const body = (
    <View style={[s.btnInner, small && { height: 48 }]}>
      <Text style={s.btnT}>{label}</Text><Ic n="arrow" size={18} />
    </View>
  );
  if (accent) return <TouchableOpacity activeOpacity={0.88} style={[s.btn, small && { height: 48 }, { backgroundColor: T.accent }]} onPress={onPress}>{body}</TouchableOpacity>;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ width: '100%' }}>
      <LinearGradient colors={[T.primary, T.primary2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.btn, small && { height: 48 }]}>
        {body}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function StatusRow({ light }) {
  return (
    <View style={s.status}>
      <Text style={s.statusT}>9:41</Text>
      <Text style={s.statusT2}>{light ? 'LTE 100%' : 'LTE 100%'}</Text>
    </View>
  );
}

function Tabs({ nav, active }) {
  const items = [
    { l: 'Home', r: 'Home', Icon: HomeIcon },
    { l: 'Pay', r: 'PayBills', Icon: CardIcon },
    { l: 'Cards', r: 'MyCard', Icon: WalletIcon },
    { l: 'Me', r: 'Rewards', Icon: UserIcon },
  ];
  return (
    <View style={s.tabWrap}>
      <View style={s.tabs}>
        {items.map(({ l, r, Icon }) => {
          const on = active === l;
          return (
            <TouchableOpacity key={l} style={s.tab} onPress={() => nav.navigate(r)}>
              <View style={[s.tabBox, on ? { backgroundColor: T.accent } : { backgroundColor: T.bg }]}>
                <Icon size={22} color={T.ink} />
              </View>
              <Text style={[s.tabL, on && { color: T.ink, fontFamily: F.b }]}>{l}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* 01 Splash #1:2 */
function Splash({ navigation }) {
  return (
    <LinearGradient colors={['#F6F9FB', '#EEF4F8']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
        <StatusRow />
        <View style={s.brandRow}>
          <View style={s.chip}><View style={s.dot24}><Ic n="wallet" size={14} /></View><Text style={s.chipT}>Payer</Text></View>
          <View style={s.chipSm}><Ic n="shield" size={14} /><Text style={s.chipT2}>Secure</Text></View>
        </View>
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <View style={s.logoRing}>
            <LinearGradient colors={[T.primary, T.primary2]} style={s.logoIn}>
              <WalletIcon size={72} color={T.ink} />
            </LinearGradient>
          </View>
          <View style={[s.miniBadge, { right: W / 2 - 120, top: 36 }]}><Ic n="wallet" size={20} /></View>
          <View style={[s.miniBadgeSm, { left: W / 2 - 130, top: 170 }]}><Ic n="wallet" size={16} /></View>
          <View style={[s.miniBadgeMd, { right: W / 2 - 130, top: 180 }]}><Ic n="wallet" size={18} /></View>
          <Text style={s.heroTitle}>Payer</Text>
          <Text style={s.heroSub}>Simple, safe Filipino banking.</Text>
          <Text style={s.heroSub}>Send, pay and save in one tap.</Text>
        </View>
        <View style={{ marginTop: 32 }}>
          <PayerBtn label="GET STARTED" onPress={() => navigation.navigate('SignUp')} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 14 }}>
            <Text style={[s.small, { fontFamily: F.s, fontSize: 14 }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}><Text style={{ fontFamily: F.b, fontSize: 14, color: T.ink }}> Log in</Text></TouchableOpacity>
          </View>
          <View style={s.homeBar} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/* 02 Sign Up #1:6 */
function SignUp({ navigation }) {
  const [name, setName] = useState('Jian Aguelo');
  const [email, setEmail] = useState('jian@email.com');
  const [pw, setPw] = useState('password123');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(true);
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 16, paddingBottom: 0 }}><StatusRow /></View>
      <LinearGradient colors={[T.primary, T.primary2]} style={s.hero176}>
        <View style={s.heroTopRow}>
          <View style={s.pillW}><Ic n="shield" size={14} /><Text style={s.pillWT}> Secure banking</Text></View>
          <View style={[s.pillW, { backgroundColor: T.accent }]}><Ic n="user" size={14} /><Text style={s.pillWT}> Sign up</Text></View>
        </View>
        <Text style={s.h28}>Sign up</Text>
        <Text style={s.sub14}>Create your account. Bank with confidence.</Text>
      </LinearGradient>
      <View style={{ padding: 16 }}>
        <Text style={s.lab}>Full name</Text>
        <View style={s.field}><Ic n="user" size={18} color={T.muted} /><TextInput style={s.fieldT} value={name} onChangeText={setName} /></View>
        <Text style={s.lab}>Email</Text>
        <View style={s.field}><Ic n="user" size={18} color={T.muted} /><TextInput style={s.fieldT} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
        <Text style={s.lab}>Password</Text>
        <View style={s.field}><Ic n="shield" size={18} color={T.muted} /><TextInput style={s.fieldT} value={pw} onChangeText={setPw} secureTextEntry={!show} /><TouchableOpacity onPress={() => setShow(!show)}><Ic n={show ? 'eyeOff' : 'eye'} size={18} color={T.muted} /></TouchableOpacity></View>
        <View style={s.strength}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={[s.sbar, { backgroundColor: i < 4 ? T.greenBright : T.border }]} />)}
          <View style={[s.sbar, { backgroundColor: T.border, flex: 1 }]} />
        </View>
        <Text style={s.small}>Strong password · 8+ characters</Text>
        <TouchableOpacity style={s.agree} onPress={() => setAgree(!agree)}>
          <View style={[s.check, agree && { backgroundColor: T.primary }]}><Text style={{ color: '#fff', fontSize: 14 }}>✓</Text></View>
          <Text style={s.small}>I agree to the Terms & Privacy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.google} onPress={() => Alert.alert('Google sign-in', 'OAuth wired here')}><Text style={{ fontFamily: F.b, fontSize: 18, color: '#4285F4' }}>G  </Text><Text style={s.googleT}>Continue with Google</Text></TouchableOpacity>
        <View style={{ marginTop: 14 }}>
          <PayerBtn label="Create account" onPress={() => {
            if (name.trim().length < 2) return Alert.alert('Enter full name');
            if (!email.includes('@')) return Alert.alert('Enter valid email');
            if (pw.length < 8) return Alert.alert('Password needs 8+ characters');
            if (!agree) return Alert.alert('Accept Terms & Privacy');
            try {
              const prev = getProfile();
              saveProfile(name.trim(), email.trim(), prev.mobile, prev.address);
            } catch (e) {}
            navigation.navigate('Verify');
          }} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}><Text style={[s.small, { textAlign: 'center', marginTop: 12, fontSize: 14 }]}>Already registered? Log in</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* 03 Verification #1:10 */
function Verify({ navigation }) {
  const [code, setCode] = useState(['5', '3', '', '']);
  const [secs, setSecs] = useState(42);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  const press = (k) => {
    if (k === '⌫') { const c = [...code]; for (let i = 3; i >= 0; i--) { if (c[i] !== '') { c[i] = ''; break; } } setCode(c); return; }
    if (k === '.') return;
    const i = code.findIndex((x) => x === ''); if (i < 0) return;
    const c = [...code]; c[i] = k; setCode(c);
    if (i === 3) setTimeout(() => navigation.navigate('Home'), 350);
  };
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.cardCol}>
        <View style={[s.pill, { backgroundColor: T.primary, flexDirection: 'row', alignItems: 'center', gap: 4 }]}><ShieldCheck size={14} color={T.ink} /><Text style={s.pillT}>Payer</Text></View>
        <Text style={[s.h28, { textAlign: 'center' }]}>Verification</Text>
        <Text style={[s.small, { textAlign: 'center' }]}>Code sent to +63 ••• ••• 4821</Text>
        <View style={s.otpRow}>{code.map((d, i) => <View key={i} style={[s.otp, (d || i === 2) && { backgroundColor: T.accent, borderColor: i === 2 ? T.ink : T.accent, borderWidth: i === 2 ? 2 : 1 }]}><Text style={s.otpT}>{d}</Text></View>)}</View>
        <View style={s.rowB}><Text style={s.small}>Didn't receive the code?</Text><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><View style={s.timer}><Clock size={14} color={T.ink} /><Text style={s.timerT}> 00:{String(secs).padStart(2, '0')}</Text></View><TouchableOpacity onPress={() => { setSecs(42); setCode(['', '', '', '']); }}><Text style={s.linkSm}>Resend</Text></TouchableOpacity></View></View>
      </View>
      <PayerBtn label="Verify" onPress={() => (code.some((x) => x === '') ? Alert.alert('Enter 4 digits') : navigation.navigate('Home'))} />
      <View style={s.keys}>{['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
        <TouchableOpacity key={k} style={s.key} onPress={() => press(k)}><Text style={s.keyT}>{k === '⌫' ? '⌫' : k}</Text></TouchableOpacity>
      ))}</View>
    </ScrollView>
  );
}

/* 04 Home #1:14 */
const QA = [
  { t: 'Send Money', r: 'SendMoney', bg: T.accent },
  { t: 'Pay Bills', r: 'PayBills', bg: T.primary },
  { t: 'Buy Load', r: 'BuyLoad', bg: T.primary2 },
  { t: 'Cash In', r: 'CashIn', bg: T.accent },
  { t: 'Savings', r: 'Savings', bg: T.primary },
  { t: 'Statements', r: 'Transactions', bg: T.primary2 },
];
function Home({ navigation }) {
  const [show, setShow] = useState(true);
  const [recent, setRecent] = useState([]);
  const [totals, setTotals] = useState({ income: 21500, spent: 2924 });
  const [balance, setBalance] = useState(24580.5);
  const [profile, setProfile] = useState({ name: 'Jian Aguelo', email: 'jian@email.com', mobile: '', address: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [spendBars, setSpendBars] = useState([]);
  const reload = () => {
    try {
      const all = getTransactions('');
      setRecent(all.slice(0, 2));
      setTotals(getTotals());
      setBalance(getBalance());
      setProfile(getProfile());
      setTodayCount(all.filter((t) => t.tgroup === 'Today').length);
      const byGroup = [];
      all.forEach((t) => {
        if (t.amount >= 0) return;
        const g = byGroup.find((x) => x.g === t.tgroup);
        if (g) g.v += -t.amount;
        else byGroup.push({ g: t.tgroup, v: -t.amount });
      });
      setSpendBars(byGroup.slice(0, 6));
    } catch (e) {}
  };
  useEffect(() => { reload(); const unsub = navigation.addListener('focus', reload); return unsub; }, [navigation]);
  const onRefresh = () => { setRefreshing(true); reload(); setRefreshing(false); };
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const maxSpend = spendBars.reduce((m, b) => Math.max(m, b.v), 0);
  const shortP = (v) => (v >= 1000 ? `₱${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₱${Math.round(v)}`);
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        <StatusRow />
        <View style={s.rowB}>
          <View><Text style={s.h20}>{greet}, {profile.name.split(' ')[0] || 'Jian'}</Text><Text style={s.small}>Welcome back to Payer</Text></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={s.icon48} onPress={() => navigation.navigate('Notifications')}>
              <Ic n="bell" size={20} />
              {todayCount > 0 ? (
                <View style={s.bellBadge}><Text style={s.bellBadgeT}>{todayCount > 9 ? '9+' : todayCount}</Text></View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={[s.icon48, { overflow: 'hidden' }]} onPress={() => navigation.navigate('Rewards')}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={{ width: 46, height: 46, borderRadius: 19 }} />
              ) : (
                <UserIcon size={22} color={T.ink} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <LinearGradient colors={[T.primary, T.primary2]} style={s.balCard}>
          <View style={s.rowB}>
            <Text style={s.pill}>Available</Text>
            <TouchableOpacity style={s.showPill} onPress={() => setShow(!show)}><Ic n={show ? 'eyeOff' : 'eye'} size={14} /><Text style={s.pillTsm}> {show ? 'Hide' : 'Show'}</Text></TouchableOpacity>
          </View>
          <Text style={s.smallD}>Available balance</Text>
          <Text style={s.bal}>{show ? fmt(balance) : '₱ ••••••'}</Text>
          <Text style={s.smallD}>Your money, protected</Text>
        </LinearGradient>
        <View style={s.rowB}><Text style={s.h16}>Quick actions</Text><TouchableOpacity onPress={() => navigation.navigate('Services')}><Text style={s.linkSm}>See all</Text></TouchableOpacity></View>
        <View style={s.grid}>{QA.map((q) => (
          <TouchableOpacity key={q.t} style={s.qa} onPress={() => navigation.navigate(q.r)}>
            <View style={[s.qaIc, { backgroundColor: q.bg }]}><Ic n={q.t.includes('Send') ? 'send' : q.t.includes('Bill') ? 'receipt' : q.t.includes('Load') ? 'phone' : 'wallet'} size={18} /></View>
            <Text style={s.qaT}>{q.t}</Text>
          </TouchableOpacity>
        ))}</View>
        <View style={s.cardColN}>
          <View style={s.rowB}><Text style={s.h13}>Spending · recent days</Text><Text style={s.pill}>This week</Text></View>
          {spendBars.length === 0 ? (
            <Text style={s.small}>No spending yet — bars appear as you pay, send, or buy load.</Text>
          ) : (
            <View>
              <View style={s.chartBox}>
                {spendBars.map((b) => {
                  const top = maxSpend > 0 && b.v === maxSpend;
                  return (
                    <View key={b.g} style={s.chartCol}>
                      <Text style={[s.chartVal, top && { color: T.ink, fontFamily: F.b }]}>{shortP(b.v)}</Text>
                      <View style={[s.barV, { height: 10 + Math.round(46 * (maxSpend ? b.v / maxSpend : 0)), backgroundColor: top ? T.accent : T.primary2, minWidth: 30 }]} />
                      <Text style={s.tiny} numberOfLines={1}>{b.g}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={[s.tiny, { marginTop: 6 }]}>Total {fmt(totals.spent)} · Income +{fmt(totals.income)}</Text>
            </View>
          )}
        </View>
        <View style={s.cardColN}>
          <View style={s.rowB}><Text style={s.h13}>Recent activity</Text><TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={s.linkSm}>View all</Text></TouchableOpacity></View>
          {recent.map((t) => (
            <TouchableOpacity key={t.id} style={s.txRow} onPress={() => navigation.navigate('Receipt', { id: t.id })}>
              <View style={[s.txIc, { backgroundColor: T.accent }]}><Ic n={t.icon} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={s.txT}>{t.name}</Text><Text style={s.small}>{t.detail}</Text></View>
              <Text style={[s.amt, { color: t.amount < 0 ? T.red : T.green }]}>{t.amount < 0 ? '-' : '+'}{fmt(Math.abs(t.amount))}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity activeOpacity={0.88} style={{ marginTop: 8 }} onPress={() => navigation.navigate('FindBranch')}>
            <LinearGradient colors={[T.primary, T.primary2]} style={s.branchCta}>
              <View style={s.branchCtaIc}><Ic n="pin" size={20} /></View>
              <View style={{ flex: 1 }}><Text style={s.h15}>Find Branch Near You</Text><Text style={s.small}>4 branches · 3 open now</Text></View>
              <Ic n="arrow" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Tabs nav={navigation} active="Home" />
    </View>
  );
}

/* 05 Nearby ATM Map #1:18 — pannable + zoomable mini-map */
const ATMS = [
  { name: 'Payer ATM – Poblacion', meta: '350 m · Open 24/7 · Cash in & out', rating: '4.8 · 128 reviews', walk: '5 min', px: 0.42, py: 0.55 },
  { name: 'Payer ATM – City Hall', meta: '800 m · Open 24/7 · Cash out', rating: '4.6 · 89 reviews', walk: '10 min', px: 0.2, py: 0.3 },
  { name: 'Payer ATM – Mall', meta: '1.2 km · Open until 9 PM · Cash in & out', rating: '4.7 · 203 reviews', walk: '15 min', px: 0.75, py: 0.4 },
];
const MAP_CW = 640;
const MAP_CH = 560;
function Atms({ navigation }) {
  const [f, setF] = useState('All');
  const [sel, setSel] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({ w: 328, h: 330 });
  const [mapActive, setMapActive] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const live = useRef({ scale: 1, x: 0, y: 0 });
  live.current = { scale, x: pan.x, y: pan.y };

  const clamp = (x, y, s) => {
    const mx = Math.max(0, (MAP_CW * s - mapSize.w) / 2);
    const my = Math.max(0, (MAP_CH * s - mapSize.h) / 2);
    return {
      x: Math.min(mx, Math.max(-mx, x)),
      y: Math.min(my, Math.max(-my, y)),
    };
  };
  const zoomTo = (ns) => {
    const c = Math.min(3, Math.max(1, ns));
    const k = c / live.current.scale;
    const p = clamp(live.current.x * k, live.current.y * k, c);
    setScale(c);
    setPan(p);
  };
  const resetMap = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        start.current = { x: live.current.x, y: live.current.y };
        setMapActive(true);
      },
      onPanResponderMove: (_, g) => {
        setPan(clamp(start.current.x + g.dx, start.current.y + g.dy, live.current.scale));
      },
      onPanResponderRelease: () => setMapActive(false),
      onPanResponderTerminate: () => setMapActive(false),
    })
  ).current;

  const centerOn = (idx) => {
    setSel(idx);
    const a = ATMS[idx];
    const s = Math.max(live.current.scale, 1.5);
    const p = clamp(
      mapSize.w / 2 - a.px * MAP_CW * s,
      mapSize.h / 2 - a.py * MAP_CH * s,
      s
    );
    setScale(s);
    setPan(p);
  };

  const pins = f === 'All' ? ATMS : f === '24/7' ? ATMS.filter((a) => /24\/7/.test(a.meta)) : ATMS.filter((a) => /Cash in/.test(a.meta));
  const current = ATMS[sel];
  const cw = MAP_CW * scale;
  const ch = MAP_CH * scale;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} scrollEnabled={!mapActive}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}><StatusRow /></View>
        <LinearGradient colors={[T.primary, T.primary2]} style={s.heroAuto}>
          <View style={s.rowB}>
            <TouchableOpacity style={s.icon48w} onPress={() => navigation.goBack()}><Ic n="back" size={20} /></TouchableOpacity>
            <TouchableOpacity style={s.icon48w} onPress={() => Alert.alert('Filters', 'All / 24-7 / Cash in')}><SlidersHorizontal size={20} color={T.ink} /></TouchableOpacity>
          </View>
          <Text style={s.smallD}>Payer</Text>
          <Text style={s.h24}>Nearby ATMs</Text>
          <Text style={s.sub13}>Drag to explore · pinch the +/− buttons to zoom.</Text>
        </LinearGradient>
        <View
          style={s.map}
          onLayout={(e) => setMapSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          {...panResponder.panHandlers}
        >
          <View style={[s.mapGrid, { left: mapSize.w / 2 - cw / 2 + pan.x, top: mapSize.h / 2 - ch / 2 + pan.y, width: cw, height: ch, right: undefined, bottom: undefined }]}>
            <View style={[s.roadH, { top: '48%' }]} />
            <View style={[s.roadV, { left: '42%' }]} />
            <View style={s.roadD} />
            {pins.map((a) => {
              const idx = ATMS.indexOf(a);
              const on = idx === sel;
              const size = on ? 52 : 34;
              return (
                <TouchableOpacity
                  key={a.name}
                  style={[s.mapPin, { left: `${a.px * 100}%`, top: `${a.py * 100}%`, marginLeft: -size / 2, marginTop: -size / 2, backgroundColor: on ? T.accent : T.white, borderWidth: on ? 0 : 1, borderColor: T.border, width: size, height: size, borderRadius: size / 2 }]}
                  onPress={() => centerOn(idx)}
                >
                  <Ic n="pin" size={on ? 24 : 15} />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={s.chipsAbs} pointerEvents="box-none">
            {[['All', 'All'], ['24/7', '24/7'], ['Cash in', 'Cash in']].map(([t, v]) => (
              <TouchableOpacity key={v} style={[s.fchip, f === v && { backgroundColor: T.primary }]} onPress={() => setF(v)}><Text style={s.fchipT}>{t}</Text></TouchableOpacity>
            ))}
          </View>
          <View style={s.zoomCol}>
            <TouchableOpacity style={s.zoomBtn} onPress={() => zoomTo(scale + 0.5)}><Text style={s.zoomT}>+</Text></TouchableOpacity>
            <TouchableOpacity style={s.zoomBtn} onPress={() => zoomTo(scale - 0.5)}><Text style={s.zoomT}>−</Text></TouchableOpacity>
          </View>
          <View style={s.mapHint}>
            <View style={s.mapHintBtn}><Text style={s.mapHintT}>{scale.toFixed(1)}x</Text></View>
            <TouchableOpacity style={s.mapHintBtn} onPress={resetMap}><Text style={s.mapHintT}>Reset</Text></TouchableOpacity>
          </View>
        </View>
        <View style={s.sheet}>
          <View style={s.grab} />
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={s.atmPhoto}><PinIcon size={34} color={T.ink} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.h16}>{current.name}</Text>
              <Text style={s.small}>{current.meta}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><StarIcon size={14} color={T.ink} /><Text style={s.txTsm}>{current.rating}</Text></View>
            </View>
          </View>
          <View style={s.rowB}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity key={i} style={[s.fchip, sel === i && { backgroundColor: T.accent }]} onPress={() => centerOn(i)}>
                <Text style={s.fchipT}>{ATMS[i].name.split('– ')[1]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.divider} />
          <View style={s.rowB}>
            <View><Text style={s.small}>Est. walk</Text><Text style={s.h16}>{current.walk}</Text></View>
            <PayerBtn small label="Get directions" onPress={() => navigation.navigate('FindBranch')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* 06 Transactions #1:22 — Lab 05: SQLite-backed, offline-first CRUD */
const BILL_RE = /meralco|pldt|water|internet|bill/i;
function Transactions({ navigation }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [totals, setTotals] = useState({ income: 0, spent: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [refreshing, setRefreshing] = useState(false);

  const reload = (search = q) => {
    try {
      setRows(getTransactions(search));
      setTotals(getTotals());
    } catch (e) {
      Alert.alert('Database error', String(e && e.message ? e.message : e));
    }
  };
  useEffect(() => { reload(''); }, []);
  const onRefresh = () => { setRefreshing(true); reload(); setRefreshing(false); };
  const handleClearHistory = () => {
    if (rows.length === 0) return Alert.alert('Already clean', 'No transaction history to clear.');
    Alert.alert('Clear history?', `${rows.length} receipt${rows.length > 1 ? 's' : ''} will be permanently removed.\nWallet and savings balances stay untouched.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all', style: 'destructive',
        onPress: () => {
          try { clearTransactions(); } catch (e) {
            return Alert.alert('Database error', String(e && e.message ? e.message : e));
          }
          setQ(''); setF('All');
          reload('');
        },
      },
    ]);
  };
  const handleRestoreSamples = () => {
    try {
      if (!reseedTransactions()) return Alert.alert('Not empty', 'Clear history first to restore samples.');
    } catch (e) {
      return Alert.alert('Database error', String(e && e.message ? e.message : e));
    }
    setQ(''); setF('All');
    reload('');
  };

  const list = rows.filter(
    (t) =>
      f === 'All' ||
      (f === 'Sent' && t.amount < 0) ||
      (f === 'Received' && t.amount > 0) ||
      (f === 'Bills' && BILL_RE.test(t.name))
  );

  const handleAdd = () => {
    if (!name.trim() || !amount.trim()) {
      Alert.alert('Validation Error', 'Please fill in name and amount.');
      return;
    }
    const v = parseFloat(amount);
    if (isNaN(v) || v <= 0) {
      Alert.alert('Validation Error', 'Amount must be a positive number.');
      return;
    }
    const signed = kind === 'expense' ? -Math.abs(v) : Math.abs(v);
    const doSave = () => {
      let newId = null;
      try {
        newId = addTransactionGetId(
          name.trim(),
          detail.trim() || 'Just now',
          signed,
          kind,
          'Today',
          kind === 'expense' ? 'receipt' : 'user'
        );
        adjustBalance(signed);
      } catch (e) {
        return Alert.alert('Database error', String(e && e.message ? e.message : e));
      }
      setName(''); setDetail(''); setAmount(''); setKind('expense');
      setModalVisible(false);
      reload();
      if (newId) navigation.navigate('Receipt', { id: newId });
    };
    if (kind === 'expense') {
      try { const block = spendBlocked(Math.abs(v)); if (block) return Alert.alert(block.title, block.msg); } catch (e) {}
      let after = '';
      try { after = `\nBalance after: ${fmt(getBalance() + signed)}`; } catch (e) {}
      Alert.alert('Confirm expense', `${name.trim()}\nDeduct ${fmt(Math.abs(v))} from wallet?${after}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Deduct ${fmt(Math.abs(v))}`, onPress: doSave },
      ]);
      return;
    }
    doSave();
  };

  const handleDelete = (id, txName) => {
    Alert.alert('Delete Confirmation', `Remove ${txName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteTransaction(id); reload(); },
      },
    ]);
  };

  const renderItem = ({ item, index }) => {
    const neg = item.amount < 0;
    const showGroup = index === 0 || list[index - 1].tgroup !== item.tgroup;
    return (
      <View>
        {showGroup && (
          <View style={s.rowB}><Text style={s.dateH}>{item.tgroup}</Text><Text style={s.tiny}>1 transaction</Text></View>
        )}
        <View style={s.txRow}>
          <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => navigation.navigate('Receipt', { id: item.id })}>
            <View style={s.txIc}><Ic n={item.icon} size={18} /></View>
            <View style={{ flex: 1 }}><Text style={s.txT}>{item.name}</Text><Text style={s.small}>{item.detail}</Text></View>
            <Text style={[s.amt, { color: neg ? T.red : T.green }]}>
              {neg ? '-' : '+'}{fmt(Math.abs(item.amount))}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(item.id, item.name)}>
            <Trash2 size={16} color={T.red} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ic n="search" size={36} color={T.primary} />
            <Text style={s.h16}>No transactions found</Text>
            <Text style={s.small}>Try a different search or filter.</Text>
            {q || f !== 'All' ? (
              <TouchableOpacity style={s.clearBtn} onPress={() => { setQ(''); setF('All'); reload(''); }}>
                <Text style={s.claimT}>Clear search</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={s.small}>Tap + Add to record one.</Text>
                <TouchableOpacity style={s.clearBtn} onPress={handleRestoreSamples}>
                  <Text style={s.claimT}>Restore samples</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListHeaderComponent={
          <View>
            <StatusRow />
            <LinearGradient colors={[T.primary, T.primary2]} style={s.txHero}>
              <View style={s.rowB}>
                <Text style={s.h20}>Transactions</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={s.addPill} onPress={() => setModalVisible(true)}>
                    <Plus size={14} color={T.ink} /><Text style={s.pillTsm}> Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.filterPill} onPress={handleClearHistory}>
                    <Trash2 size={14} color={T.red} />
                  </TouchableOpacity>
                  <View style={s.filterPill}><FilterIcon size={14} color={T.ink} /><Text style={s.pillTsm}> Filter</Text></View>
                </View>
              </View>
              <View style={s.search}>
                <Ic n="search" size={18} color={T.muted} />
                <TextInput
                  style={{ flex: 1, fontFamily: F.r, fontSize: 14 }}
                  placeholder="Search transactions (SQL LIKE)..."
                  value={q}
                  onChangeText={(text) => { setQ(text); try { setRows(getTransactions(text)); } catch (e) { Alert.alert('Database error', String(e && e.message ? e.message : e)); } }}
                />
              </View>
              <View style={s.tabs4}>{['All', 'Sent', 'Received', 'Bills'].map((c) => (
                <TouchableOpacity key={c} style={[s.tab4, f === c && { backgroundColor: T.accent }]} onPress={() => setF(c)}><Text style={s.tab4T}>{c}</Text></TouchableOpacity>
              ))}</View>
            </LinearGradient>
            <View style={s.rowB2}>
              <View style={s.sum}><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><View style={s.sumIc}><ArrowUpRight size={16} color={T.ink} /></View><Text style={s.small}>Income</Text></View><Text style={[s.h15, { color: T.green }]}>+{fmt(totals.income)}</Text></View>
              <View style={s.sum}><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><View style={s.sumIc}><ArrowDownLeft size={16} color={T.ink} /></View><Text style={s.small}>Spent</Text></View><Text style={[s.h15, { color: T.red }]}>-{fmt(totals.spent)}</Text></View>
            </View>
          </View>
        }
      />
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={s.modalCard}>
            <Text style={s.h16}>Add transaction</Text>
            <Text style={s.labSm}>Name</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Meralco" value={name} onChangeText={setName} /></View>
            <Text style={s.labSm}>Detail</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Today, 9:12 AM" value={detail} onChangeText={setDetail} /></View>
            <Text style={s.labSm}>Amount (PHP)</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. 1240.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" /></View>
            <View style={s.chips3}>
              {['expense', 'income'].map((k) => (
                <TouchableOpacity key={k} style={[s.amtChip, kind === k && { backgroundColor: T.accent }]} onPress={() => setKind(k)}>
                  <Text style={s.amtChipT}>{k === 'expense' ? 'Spent' : 'Income'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PayerBtn label="Save" onPress={handleAdd} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.linkSm}>Cancel</Text></TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Tabs nav={navigation} active="Pay" />
    </View>
  );
}

/* 07 Find Branch #1:26 */
const hourLabel = (h) => (h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`);
function branchOpen(b, nowHour) {
  if (b.closed) return false;
  return nowHour >= b.openH && nowHour < b.closeH;
}
function FindBranch({ navigation }) {
  const [q, setQ] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sel, setSel] = useState('Payer Branch – Poblacion');
  const nowHour = new Date().getHours();
  const all = [
    { b: 'Payer Branch – Poblacion', dist: '350 m', addr: 'Rizal St., Poblacion, Mati City', phone: '+63875360101', openH: 8, closeH: 20, services: 'Cash in/out · Bills · Cards', x: 140, y: 60 },
    { b: 'Payer Branch – City Hall', dist: '800 m', addr: 'City Hall Complex, Mati City', phone: '+63875360102', openH: 9, closeH: 18, services: 'Bills · New accounts', x: 60, y: 100 },
    { b: 'Payer Branch – Mall', dist: '1.2 km', addr: '2F Sunrise Mall, Mati City', phone: '+63875360103', openH: 10, closeH: 21, services: 'Cash in/out · Cards', x: 230, y: 90 },
    { b: 'Payer Branch – Terminal', dist: '2.1 km', addr: 'Integrated Terminal, Mati City', phone: '+63875360104', openH: 9, closeH: 18, closed: true, services: 'ATM only', x: 150, y: 130 },
  ];
  const list = all
    .filter((x) => x.b.toLowerCase().includes(q.toLowerCase()))
    .filter((x) => !onlyOpen || branchOpen(x, nowHour));
  const openCount = all.filter((x) => branchOpen(x, nowHour)).length;
  const callBranch = async (x) => {
    try {
      const ok = await Linking.canOpenURL(`tel:${x.phone}`);
      if (ok) return Linking.openURL(`tel:${x.phone}`);
      Alert.alert(x.b, x.phone);
    } catch (e) {
      Alert.alert(x.b, x.phone);
    }
  };
  const directBranch = (x) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.b}, ${x.addr}`)}`;
    Linking.openURL(url).catch(() => Alert.alert('Maps unavailable', x.addr));
  };
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32 }}>
      <StatusRow />
      <LinearGradient colors={[T.primary, T.primary2]} style={s.branchHero}>
        <View style={s.rowB}>
          <TouchableOpacity style={s.icon48w} onPress={() => navigation.goBack()}><Ic n="x" size={18} /></TouchableOpacity>
          <Text style={s.pill}>{all.length} nearby</Text>
        </View>
        <Text style={s.h24}>Find Branch</Text>
        <Text style={s.sub13}>{openCount} open now · tap a pin or card for details</Text>
      </LinearGradient>
      <View style={s.searchTall}><Ic n="search" size={18} color={T.muted} /><TextInput style={{ flex: 1, fontFamily: F.r, fontSize: 14 }} placeholder="Search branch…" value={q} onChangeText={setQ} /></View>
      <View style={s.searchTall}><View style={[s.pinY, { backgroundColor: T.accent }]}><Ic n="wallet" size={16} /></View><Text style={s.txT}>From: My Payer wallet</Text><View style={{ marginLeft: 'auto' }}><ArrowUpRight size={18} color={T.muted} /></View></View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[['All branches', false], ['Open now', true]].map(([t, v]) => (
          <TouchableOpacity key={t} style={[s.fchip, !onlyOpen === !v && { backgroundColor: T.accent }]} onPress={() => setOnlyOpen(v)}>
            <Text style={s.fchipT}>{t}</Text>
          </TouchableOpacity>
        ))}
        <Text style={[s.tiny, { alignSelf: 'center', marginLeft: 'auto' }]}>{list.length} result{list.length === 1 ? '' : 's'}</Text>
      </View>
      <View style={s.miniMap}>
        <View style={s.roadH} />
        <View style={s.roadV} />
        <View style={s.roadD} />
        {list.map((x) => {
          const on = sel === x.b;
          const open = branchOpen(x, nowHour);
          return (
            <TouchableOpacity
              key={x.b}
              style={[s.mapPin, { left: x.x, top: x.y, backgroundColor: on ? T.accent : T.white, width: on ? 46 : 34, height: on ? 46 : 34, borderRadius: on ? 23 : 17, borderWidth: on ? 0 : 2, borderColor: open ? T.primary : T.border, shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }]}
              onPress={() => setSel(x.b)}
            >
              <Ic n="pin" size={on ? 22 : 16} color={open ? T.ink : T.muted} />
              {on ? (
                <View style={s.pinBubble}><Text style={s.pinBubbleT}>{x.b.split('– ')[1]}</Text></View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {list.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ic n="pin" size={36} color={T.primary} />
          <Text style={s.h16}>No branches found</Text>
          <Text style={s.small}>Try a different search or filter.</Text>
          <TouchableOpacity style={s.clearBtn} onPress={() => { setQ(''); setOnlyOpen(false); }}><Text style={s.claimT}>Clear filters</Text></TouchableOpacity>
        </View>
      ) : null}
      {list.map((x) => {
        const open = branchOpen(x, nowHour);
        const expanded = sel === x.b;
        return (
          <TouchableOpacity key={x.b} activeOpacity={0.85} style={[s.branchCard, expanded && { borderColor: T.primary, borderWidth: 2 }]} onPress={() => setSel(x.b)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.pinY, { backgroundColor: expanded ? T.accent : open ? T.primary2 : '#E8EDF3' }]}><Ic n="pin" size={18} color={open || expanded ? T.ink : T.muted} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.h15}>{x.b}</Text>
                <Text style={s.tiny}>{x.dist} · {open ? `Open until ${hourLabel(x.closeH)}` : `Closed · Opens ${hourLabel(x.openH)}`}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={open ? s.open : s.closed}>{open ? 'Open' : 'Closed'}</Text>
                <Ic n="chev" size={16} color={T.muted} />
              </View>
              <TouchableOpacity style={s.callBtn} onPress={() => callBranch(x)}><Ic n="phone" size={18} color="#fff" /></TouchableOpacity>
            </View>
            {expanded ? (
              <View style={{ gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border }}>
                <View style={s.kvRow}><Text style={s.small}>Address</Text><Text style={[s.txTsm, { flex: 1, textAlign: 'right' }]}>{x.addr}</Text></View>
                <View style={s.kvRow}><Text style={s.small}>Services</Text><Text style={[s.txTsm, { flex: 1, textAlign: 'right' }]}>{x.services}</Text></View>
                <View style={s.kvRow}><Text style={s.small}>Hours</Text><Text style={s.txTsm}>{hourLabel(x.openH)} – {hourLabel(x.closeH)} daily</Text></View>
                <View style={s.kvRow}><Text style={s.small}>Phone</Text><Text style={s.txTsm}>{x.phone}</Text></View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity style={[s.fchip, { flex: 1, alignItems: 'center', backgroundColor: T.accent, paddingVertical: 10 }]} onPress={() => callBranch(x)}><Text style={s.fchipT}>Call branch</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.fchip, { flex: 1, alignItems: 'center', backgroundColor: T.primary, borderWidth: 0, paddingVertical: 10 }]} onPress={() => directBranch(x)}><Text style={s.fchipT}>Directions →</Text></TouchableOpacity>
                </View>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('Atms')}>
        <LinearGradient colors={[T.primary, T.primary2]} style={s.mapCtaBtn}>
          <Ic n="pin" size={18} /><Text style={s.btnT}> View full map</Text><Ic n="arrow" size={18} />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* 08 Services #1:30 */
const SVC_OFFERS = [
  ['Savings Boost', '3.0%', 'Savings'], ['Load Promo', '₱99', 'Promo'], ['Bills Reward', '₱20', 'Reward'],
  ['Cash In Bonus', '₱30', 'Promo'], ['Transfer Free', '0 fee', 'Promo'], ['Referral', '₱100', 'Reward'],
];
function Services({ navigation }) {
  const [sq, setSq] = useState('');
  const offers = SVC_OFFERS.filter(([t]) => t.toLowerCase().includes(sq.toLowerCase()));
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <StatusRow />
        <View style={s.svcHero}>
          <View style={s.search}><Ic n="search" size={16} color={T.muted} /><TextInput placeholder="Search services" value={sq} onChangeText={setSq} style={{ flex: 1, fontFamily: F.r, fontSize: 14 }} /></View>
          <View style={s.rowB}><View><Text style={s.tiny}>Available balance</Text><Text style={s.h18}>₱24,580.50</Text></View><Text style={s.pill}>Ready to pay</Text></View>
        </View>
        <Text style={[s.h16, { marginTop: 12 }]}>Services</Text>
        <View style={s.grid3}>{[['Bills', 'PayBills', 'receipt'], ['Load', 'BuyLoad', 'phone'], ['Transfer', 'SendMoney', 'send']].map(([x, r, ic]) => (
          <TouchableOpacity key={x} style={s.svc} onPress={() => navigation.navigate(r)}>
            <View style={s.svcIc}><Ic n={ic} size={18} /></View><Text style={s.txTsm}>{x}</Text>
          </TouchableOpacity>
        ))}</View>
        <View style={s.rowB}><Text style={s.h16}>Offers for you</Text><TouchableOpacity onPress={() => navigation.navigate('Rewards')}><Text style={s.pill}>View all</Text></TouchableOpacity></View>
        <LinearGradient colors={[T.primary, T.primary2]} style={s.promoBig}>
          <View><Text style={s.pill}>Cashback</Text><Text style={s.h22}>₱50</Text></View>
          <View style={s.rowB}><Text style={s.txT}>Bills & load</Text><TouchableOpacity style={s.claimSm} onPress={() => navigation.navigate('Rewards')}><Text style={s.claimT}>Claim</Text></TouchableOpacity></View>
        </LinearGradient>
        <View style={s.grid2}>
          {offers.map(([t, v, tag]) => (
            <View key={t} style={s.offer}>
              <View style={s.rowB}><View style={s.svcIcSm}><Ic n="shield" size={16} /></View><Text style={s.pillSm}>{tag}</Text></View>
              <Text style={s.txTsm}>{t}</Text><Text style={s.h16}>{v}</Text>
              <TouchableOpacity style={s.claimSm} onPress={() => Alert.alert('Offer saved', t, [{ text: 'View', onPress: () => navigation.navigate('Rewards') }, { text: 'OK' }])}><Text style={s.claimT}>Get</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <Tabs nav={navigation} active="Pay" />
    </View>
  );
}

/* 09 My Card #1:34 */
function MyCard({ navigation }) {
  const [fr, setFr] = useState(false);
  const [det, setDet] = useState(false);
  const [revealSecs, setRevealSecs] = useState(0);
  const revealTimer = useRef(null);
  const [limit, setLimit] = useState(0);
  const [customLim, setCustomLim] = useState('');
  const [todaySpent, setTodaySpent] = useState(0);
  const [holder, setHolder] = useState('JIAN AGUELO');
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [added, setAdded] = useState('');
  const reloadCard = () => {
    try {
      const p = getProfile();
      setFr(!!p.frozen);
      setLimit(p.spend_limit || 0);
      setTodaySpent(getTodaySpent());
      if (p.name) setHolder(p.name.toUpperCase());
    } catch (e) {}
  };
  useEffect(() => { reloadCard(); const unsub = navigation.addListener('focus', reloadCard); return unsub; }, [navigation]);
  useEffect(() => () => { if (revealTimer.current) clearInterval(revealTimer.current); }, []);
  const stopReveal = () => {
    if (revealTimer.current) { clearInterval(revealTimer.current); revealTimer.current = null; }
    setDet(false);
    setRevealSecs(0);
  };
  const authenticate = async () => {
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        return new Promise((resolve) => {
          Alert.alert('No biometrics found', 'No fingerprint or face unlock is set up. Reveal card number anyway?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Reveal', onPress: () => resolve(true) },
          ]);
        });
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock card details',
        cancelLabel: 'Cancel',
      });
      return !!res.success;
    } catch (e) {
      return false;
    }
  };
  const toggleDetails = async () => {
    if (det) { stopReveal(); return; }
    const ok = await authenticate();
    if (!ok) return;
    if (revealTimer.current) clearInterval(revealTimer.current);
    setDet(true);
    setRevealSecs(20);
    revealTimer.current = setInterval(() => {
      setRevealSecs((sec) => {
        if (sec <= 1) {
          if (revealTimer.current) clearInterval(revealTimer.current);
          revealTimer.current = null;
          setDet(false);
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
  };
  const applyCustomLimit = () => {
    const v = Math.round(parseFloat(customLim));
    if (isNaN(v) || v < 100) return Alert.alert('Invalid cap', 'Enter at least ₱100, or pick Off.');
    try { setSpendLimit(v); } catch (e) {}
    setLimit(v);
    setCustomLim('');
  };
  const Tog = ({ v, on }) => (
    <TouchableOpacity onPress={on} style={[s.tog, v && { backgroundColor: T.accent, alignItems: 'flex-end' }]}>
      <View style={[s.knob, v && { backgroundColor: T.ink }]} />
    </TouchableOpacity>
  );
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
        <StatusRow />
        <LinearGradient colors={fr ? ['#D7E1E8', '#E6EEF3'] : [T.primary, T.primary2]} style={[s.bankCard, fr && { opacity: 0.7 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={s.chipSim}><CreditCard size={20} color={T.ink} /></View>
            <Text style={[s.activePill, fr && { backgroundColor: T.redBg, color: T.red }]}>{fr ? 'Frozen' : '● Active'}</Text>
          </View>
          <Text style={s.smallD}>Primary card</Text><Text style={s.h24}>My Card</Text>
          <Text style={s.cardNum}>{det ? '5312 3456 7890 4821' : '•••• •••• •••• 4821'}</Text>
          <View style={s.rowB}><Text style={s.smallD}>Cardholder{'\n'}{holder}</Text><Text style={[s.smallD, { textAlign: 'right' }]}>Expires{'\n'}09/28{det ? '\nCVV 482' : ''}</Text></View>
        </LinearGradient>
        <Text style={[s.h14, { marginTop: 12 }]}>Controls</Text>
        <View style={s.cardColN}>
          <View style={s.ctlRow}>
            <View style={{ flex: 1 }}><Text style={s.txT}>Freeze card</Text><Text style={s.small}>{fr ? 'Locked — spending blocked' : 'Instant lock'}</Text></View>
            <Tog v={fr} on={() => {
              const nv = !fr;
              try { setFrozen(nv); } catch (e) {}
              setFr(nv);
              Alert.alert(nv ? 'Card frozen' : 'Card unfrozen', nv ? 'Send, pay, load and deposits are blocked.' : 'Spending restored.');
            }} />
          </View>
          <View style={s.ctlRow}><View style={{ flex: 1 }}><Text style={s.txT}>Details</Text><Text style={s.small}>{det ? `Visible · hides in ${revealSecs}s` : 'Biometric locked'}</Text></View><Tog v={det} on={toggleDetails} /></View>
          <View style={s.ctlRow2}>
            <View style={{ flex: 1 }}>
              <View style={s.rowB}><View><Text style={s.h14}>Spending limit</Text><Text style={s.small}>{limit > 0 ? `Spent ${fmt(todaySpent)} of ${fmt(limit)} today` : 'No daily cap'}</Text></View></View>
              {limit > 0 ? (
                <View style={s.prog}><View style={[s.progFill, { width: `${Math.min(100, Math.round((todaySpent / limit) * 100))}%`, backgroundColor: todaySpent >= limit ? T.red : T.primary }]} /></View>
              ) : null}
              <View style={s.chips}>
                {[0, 5000, 10000, 20000].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, limit === v && { backgroundColor: T.accent, borderWidth: 0 }]}
                    onPress={() => { try { setSpendLimit(v); } catch (e) {} setLimit(v); setCustomLim(''); }}
                  >
                    <Text style={s.chipT}>{v === 0 ? 'Off' : fmt(v)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <View style={[s.input48, { flex: 1, marginTop: 0, height: 48 }]}>
                  <TextInput style={s.fieldT} placeholder="Custom cap, e.g. 7500" value={customLim} onChangeText={(t) => setCustomLim(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
                </View>
                <TouchableOpacity style={s.claimSm} onPress={applyCustomLimit}><Text style={s.claimT}>Set</Text></TouchableOpacity>
              </View>
              {limit > 0 && ![5000, 10000, 20000].includes(limit) ? (
                <Text style={[s.small, { color: T.green, fontFamily: F.s }]}>Custom cap {fmt(limit)}</Text>
              ) : null}
            </View>
          </View>
        </View>
        <Text style={[s.h14, { marginTop: 12 }]}>Add card</Text>
        <View style={s.cardColN}>
          <Text style={s.labSm}>Card number</Text>
          <View style={s.input48}><TextInput placeholder="0000 0000 0000 0000" keyboardType="number-pad" value={num} onChangeText={setNum} style={s.fieldT} /></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Text style={s.labSm}>Expiry</Text><View style={s.input48}><TextInput placeholder="MM / YY" value={exp} onChangeText={setExp} style={s.fieldT} /></View></View>
            <View style={{ flex: 1 }}><Text style={s.labSm}>CVV</Text><View style={s.input48}><TextInput placeholder="•••" value={cvv} onChangeText={setCvv} secureTextEntry keyboardType="number-pad" style={s.fieldT} /></View></View>
          </View>
          <PayerBtn label="Add card" accent onPress={() => {
            const digits = num.replace(/\D/g, '');
            if (digits.length < 16) return Alert.alert('Enter 16-digit card');
            if (!/^\d{2}\s?\/\s?\d{2}$/.test(exp.trim())) return Alert.alert('Expiry must be MM / YY');
            if (cvv.trim().length < 3) return Alert.alert('Enter 3-digit CVV');
            setAdded(`•••• ${digits.slice(-4)} added`);
            setNum(''); setExp(''); setCvv('');
            Alert.alert('Card added', `•••• ${digits.slice(-4)}`);
          }} />
          {added ? <Text style={[s.small, { color: T.green, fontFamily: F.s }]}>{added}</Text> : null}
        </View>
      </ScrollView>
      <Tabs nav={navigation} active="Cards" />
    </View>
  );
}

/* 10 Pay Bills #1:38 — Figma: 360x800, card radius 20, rows radius 16, total Bold 26 */
const BASE_BILLS = [
  { n: 'Meralco', v: 1240, ic: 'zap', hot: true },
  { n: 'Water District', v: 380, ic: 'drop', hot: false },
  { n: 'Internet', v: 1499, ic: 'wifi', hot: false },
  { n: 'Mobile Postpaid', v: 299, ic: 'phone', hot: false },
];
function PayBills({ navigation }) {
  const [bills, setBills] = useState(BASE_BILLS);
  const [sel, setSel] = useState(BASE_BILLS.map(() => true));
  const [managing, setManaging] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [nbName, setNbName] = useState('');
  const [nbAmt, setNbAmt] = useState('');
  const total = bills.reduce((a, b, i) => a + (sel[i] ? b.v : 0), 0);

  const moreOptions = () => {
    Alert.alert('Bill options', 'Manage your bills', [
      { text: 'Add custom bill', onPress: () => { setNbName(''); setNbAmt(''); setAddVisible(true); } },
      { text: managing ? 'Done managing' : 'Remove bills…', onPress: () => setManaging(!managing) },
      { text: 'Select all', onPress: () => setSel(bills.map(() => true)) },
      { text: 'Clear all', onPress: () => setSel(bills.map(() => false)) },
      {
        text: 'Sort: highest first',
        onPress: () => {
          const paired = bills.map((b, i) => [b, sel[i]]);
          paired.sort((a, b) => b[0].v - a[0].v);
          setBills(paired.map(([b]) => b));
          setSel(paired.map(([, s]) => s));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const handleAddBill = () => {
    if (nbName.trim().length < 2) return Alert.alert('Enter biller name');
    const v = parseFloat(nbAmt);
    if (isNaN(v) || v <= 0) return Alert.alert('Enter a positive amount');
    setBills([...bills, { n: nbName.trim(), v: v, ic: 'receipt', hot: false }]);
    setSel([...sel, true]);
    setNbName(''); setNbAmt('');
    setAddVisible(false);
  };
  const handleRemoveBill = (i) => {
    Alert.alert('Remove bill', `Remove ${bills[i].n} from this list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          setBills(bills.filter((_, j) => j !== i));
          setSel(sel.filter((_, j) => j !== i));
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 200 }}>
        <StatusRow />
        <View style={s.rowB}>
          <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={24} /></TouchableOpacity>
          <TouchableOpacity style={s.icon48} onPress={moreOptions}><Ic n="more" size={24} /></TouchableOpacity>
        </View>
        <Text style={[s.h28, { marginTop: 12 }]}>Pay Bills</Text>
        <Text style={[s.sub14, { marginBottom: 4 }]}>Review your selected bills before you pay.</Text>
        <View style={s.cardColN}>
          <View style={s.rowB}>
            <Text style={s.h16}>{managing ? 'Manage bills' : 'Selected bills'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Text style={s.pill}>{sel.filter(Boolean).length} selected</Text>
              {managing ? (
                <TouchableOpacity onPress={() => setManaging(false)}><Text style={s.linkSm}>Done</Text></TouchableOpacity>
              ) : null}
            </View>
          </View>
          {bills.map((b, i) => (
            <TouchableOpacity key={`${b.n}-${i}`} activeOpacity={0.85} style={s.billRow} onPress={() => { const c = [...sel]; c[i] = !c[i]; setSel(c); }}>
              <View style={s.txIc}><Ic n={b.ic} size={22} /></View>
              <View style={{ flex: 1, gap: 2 }}><Text style={s.h15}>{b.n}</Text><Text style={s.small}>Due in 3 days</Text><Text style={b.hot ? s.dueRed : s.due}>Due soon</Text></View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.h15}>{fmt(b.v)}</Text>
                {managing ? (
                  <TouchableOpacity style={s.delBtn} onPress={() => handleRemoveBill(i)}>
                    <Trash2 size={16} color={T.red} />
                  </TouchableOpacity>
                ) : (
                  <View style={[s.check, sel[i] ? { backgroundColor: T.primary, borderWidth: 0 } : { backgroundColor: T.white, borderWidth: 1.5, borderColor: T.border }]}>
                    {sel[i] ? <Text style={{ color: '#fff', fontSize: 13, fontFamily: F.b }}>✓</Text> : null}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.addBillRow} onPress={() => { setNbName(''); setNbAmt(''); setAddVisible(true); }}>
            <View style={[s.txIc, { backgroundColor: T.accent }]}><Plus size={20} color={T.ink} /></View>
            <Text style={s.txT}>Add custom bill</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={addVisible} animationType="slide" transparent onRequestClose={() => setAddVisible(false)}>
        <View style={s.modalWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={s.modalCard}>
            <Text style={s.h16}>Add custom bill</Text>
            <Text style={s.labSm}>Biller name</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Converge" value={nbName} onChangeText={setNbName} /></View>
            <Text style={s.labSm}>Amount (PHP)</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. 1500.00" value={nbAmt} onChangeText={setNbAmt} keyboardType="decimal-pad" /></View>
            <PayerBtn label="Add bill" onPress={handleAddBill} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAddVisible(false)}><Text style={s.linkSm}>Cancel</Text></TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <View style={s.bottomSheet}>
        <LinearGradient colors={[T.primary, T.primary2]} style={s.totalBar}>
          <View><Text style={s.smallD}>Total</Text><Text style={s.h26}>{fmt(total)}</Text></View>
          <Text style={s.pill}>{sel.filter(Boolean).length} bills</Text>
        </LinearGradient>
        <PayerBtn label="Pay now" onPress={() => {
          if (!total) return Alert.alert('Select at least 1 bill');
          try { const block = spendBlocked(total); if (block) return Alert.alert(block.title, block.msg); } catch (e) {}
          const count = sel.filter(Boolean).length;
          let after = '';
          try { after = `\nBalance after: ${fmt(getBalance() - total)}`; } catch (e) {}
          Alert.alert('Confirm payment', `Pay ${fmt(total)} for ${count} bill${count > 1 ? 's' : ''}?${after}`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Pay ${fmt(total)}`,
              onPress: () => {
                let firstId = null;
                try {
                  bills.forEach((b, i) => {
                    if (sel[i]) {
                      const id = addTransactionGetId(b.n, 'Bills · Just now', -b.v, 'expense', 'Today', b.ic);
                      if (!firstId) firstId = id;
                    }
                  });
                  adjustBalance(-total);
                } catch (e) {
                  return Alert.alert('Database error', String(e && e.message ? e.message : e));
                }
                if (firstId) navigation.navigate('Receipt', { id: firstId });
                else navigation.navigate('Transactions');
              },
            },
          ]);
        }} />
      </View>
    </View>
  );
}

/* 11 Send Money #1:42 */
const AV_COLORS = ['#F9E6A8', '#AEC4D4', '#C9D9E5', '#EAF7F1'];
function SendMoney({ navigation, route }) {
  const [contacts, setContacts] = useState([]);
  const [toId, setToId] = useState(null);
  const [amt, setAmt] = useState('₱2,500');
  const [note, setNote] = useState('');
  const [addVisible, setAddVisible] = useState(false);
  const [cName, setCName] = useState('');
  const [cMobile, setCMobile] = useState('');
  const [direct, setDirect] = useState('');
  const val = amt === '₱500' ? 500 : amt === '₱1,000' ? 1000 : 2500;
  const reloadContacts = () => {
    try {
      const rows = getContacts();
      setContacts(rows);
      if (!rows.find((r) => r.id === toId)) setToId(rows.length ? rows[0].id : null);
    } catch (e) {}
  };
  useEffect(() => { reloadContacts(); const unsub = navigation.addListener('focus', reloadContacts); return unsub; }, [navigation]);
  useEffect(() => {
    const p = route && route.params ? route.params : {};
    if (p.qrMobile || p.qrAmount) {
      if (p.qrMobile) setDirect(String(p.qrMobile).replace(/\D/g, '').slice(0, 11));
      if (p.qrAmount && Number(p.qrAmount) > 0) {
        const v = Number(p.qrAmount);
        if (v === 500) { setAmt('₱500'); setCustom(''); }
        else if (v === 1000) { setAmt('₱1,000'); setCustom(''); }
        else if (v === 2500) { setAmt('₱2,500'); setCustom(''); }
        else setCustom(String(v));
      }
      navigation.setParams({ qrMobile: undefined, qrName: undefined, qrAmount: undefined });
    }
  }, [route && route.params]);
  const to = contacts.find((c) => c.id === toId) || { name: 'Select contact', mobile: '' };
  const directValid = /^09\d{9}$/.test(direct.trim());
  const directMatch = directValid ? contacts.find((c) => c.mobile === direct.trim()) : null;
  const recipient = directValid
    ? { name: directMatch ? directMatch.name : direct.trim(), mobile: direct.trim(), oneOff: !directMatch }
    : { name: to.name, mobile: to.mobile || '', oneOff: false };
  const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const openAdd = () => { setCName(''); setCMobile(''); setAddVisible(true); };
  const handleAddContact = () => {
    if (cName.trim().length < 2) return Alert.alert('Enter contact name');
    if (!/^09\d{9}$/.test(cMobile.trim())) return Alert.alert('Invalid mobile', 'Enter an 11-digit number starting with 09.');
    try {
      const id = addContactGetId(cName.trim(), cMobile.trim());
      setCName(''); setCMobile('');
      setAddVisible(false);
      reloadContacts();
      if (id) setToId(id);
    } catch (e) {
      return Alert.alert('Database error', String(e && e.message ? e.message : e));
    }
  };
  const handleDeleteContact = (contact) => {
    Alert.alert('Remove contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          try { deleteContact(contact.id); } catch (e) {}
          reloadContacts();
        },
      },
    ]);
  };
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.rowB}>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={20} /></TouchableOpacity>
        <Text style={s.h18}>Send Money</Text>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="x" size={18} /></TouchableOpacity>
      </View>
      <View style={s.cardColN}>
        <View style={s.rowB}><Text style={s.h16}>Contacts ({contacts.length})</Text><View style={{ flexDirection: 'row', gap: 14 }}><TouchableOpacity onPress={() => navigation.navigate('ScanQR')}><Text style={s.linkSm}>◈ Scan</Text></TouchableOpacity><TouchableOpacity onPress={openAdd}><Text style={s.linkSm}>+ Add</Text></TouchableOpacity></View></View>
        <View style={s.recentMain}>
          <View style={s.avBig}><Text style={[s.avT, { fontSize: 18 }]}>{directValid ? initials(recipient.name) : to.name !== 'Select contact' ? initials(to.name) : '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.h15}>{directValid ? recipient.name : to.name}</Text>
            <Text style={s.small}>{directValid ? recipient.mobile + (recipient.oneOff ? ' · one-time' : ' · saved') : to.mobile || 'Saved contact'}</Text>
          </View>
          <ChevronRight size={20} color={T.muted} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
          {contacts.map((contact, ci) => (
            <TouchableOpacity
              key={contact.id}
              style={{ alignItems: 'center', gap: 4 }}
              onPress={() => { setToId(contact.id); setDirect(''); }}
              onLongPress={() => handleDeleteContact(contact)}
            >
              <View style={[s.av, { backgroundColor: AV_COLORS[ci % AV_COLORS.length] }, toId === contact.id && { borderWidth: 2, borderColor: T.ink }]}>
                <Text style={s.avT}>{initials(contact.name)}</Text>
              </View>
              <Text style={[s.tiny, toId === contact.id && { color: T.ink, fontFamily: F.b }]}>{contact.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{ alignItems: 'center', gap: 4 }} onPress={openAdd}>
            <View style={[s.av, { backgroundColor: T.accent }]}><Text style={s.avT}>+</Text></View><Text style={s.tiny}>New</Text>
          </TouchableOpacity>
        </ScrollView>
        <Text style={s.tiny}>Tap to select · hold a contact to remove</Text>
      </View>
      <View style={s.cardColN}>
        <Text style={s.labSm}>Send to a number</Text>
        <View style={s.field}>
          <Ic n="phone" size={18} color={T.muted} />
          <TextInput
            style={s.fieldT}
            placeholder="09XX XXX XXXX — anyone, saved or not"
            value={direct}
            onChangeText={(t) => setDirect(t.replace(/\D/g, '').slice(0, 11))}
            keyboardType="number-pad"
            maxLength={11}
          />
          {direct.length > 0 ? (
            <TouchableOpacity onPress={() => setDirect('')}><Ic n="x" size={16} color={T.muted} /></TouchableOpacity>
          ) : null}
        </View>
        {direct.length > 0 && !directValid ? (
          <Text style={[s.tiny, { color: T.red }]}>Must be 11 digits starting with 09</Text>
        ) : null}
        {directValid && recipient.oneOff ? (
          <View style={s.rowB}>
            <Text style={s.small}>Not in contacts — one-time transfer</Text>
            <TouchableOpacity onPress={() => { setCMobile(direct.trim()); setCName(''); setAddVisible(true); }}>
              <Text style={s.linkSm}>+ Save</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      <View style={s.cardColN}>
        <Text style={s.labSm}>Amount</Text>
        <Text style={s.bigAmt}>₱ {val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
        <Text style={s.small}>Sending to {directValid ? recipient.name : to.name}</Text>
      </View>
      <View style={s.chips3}>{['₱500', '₱1,000', '₱2,500'].map((a) => (
        <TouchableOpacity key={a} style={[s.amtChip, amt === a && { backgroundColor: T.accent }]} onPress={() => setAmt(a)}><Text style={s.amtChipT}>{a}</Text></TouchableOpacity>
      ))}</View>
      <View style={s.noteRow}><PencilIcon size={16} color={T.muted} /><TextInput style={{ flex: 1, fontFamily: F.r }} placeholder="Add a note (optional)" value={note} onChangeText={setNote} /></View>
      <View style={s.rowB}><Text style={s.feeT}>Transfer fee</Text><Text style={s.freeT}>Free</Text></View>
      <PayerBtn label="Confirm" accent onPress={() => {
        if (!directValid && !toId) return Alert.alert('Choose a recipient', 'Pick a contact or type an 11-digit mobile number.');
        const rName = directValid ? recipient.name : to.name;
        try { const block = spendBlocked(val); if (block) return Alert.alert(block.title, block.msg); } catch (e) {}
        let after = '';
        try { after = `\nBalance after: ${fmt(getBalance() - val)}`; } catch (e) {}
        Alert.alert('Confirm transfer', `Send ${fmt(val)} to ${rName}?${note.trim() ? `\nNote: ${note.trim()}` : ''}${after}`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Send ${fmt(val)}`,
            onPress: () => {
              let newId = null;
              try {
                newId = addTransactionGetId(`Send · ${rName}`, note.trim() || 'Transfer', -val, 'expense', 'Today', 'send');
                adjustBalance(-val);
              } catch (e) {
                return Alert.alert('Database error', String(e && e.message ? e.message : e));
              }
              if (newId) navigation.navigate('Receipt', { id: newId });
              else navigation.navigate('Transactions');
            },
          },
        ]);
      }} />
      <Modal visible={addVisible} animationType="slide" transparent onRequestClose={() => setAddVisible(false)}>
        <View style={s.modalWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={s.modalCard}>
            <Text style={s.h16}>Add contact</Text>
            <Text style={s.labSm}>Full name</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Ana Reyes" value={cName} onChangeText={setCName} /></View>
            <Text style={s.labSm}>Mobile number</Text>
            <View style={s.field}><Ic n="phone" size={18} color={T.muted} /><TextInput style={s.fieldT} placeholder="09XX XXX XXXX" value={cMobile} onChangeText={(t) => setCMobile(t.replace(/\D/g, '').slice(0, 11))} keyboardType="number-pad" maxLength={11} /></View>
            <PayerBtn label="Save contact" onPress={handleAddContact} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAddVisible(false)}><Text style={s.linkSm}>Cancel</Text></TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* Savings — deposit / withdraw between wallet and savings pot */
function Savings({ navigation }) {
  const [mode, setMode] = useState('deposit');
  const [amt, setAmt] = useState('₱1,000');
  const [custom, setCustom] = useState('');
  const [wallet, setWallet] = useState(24580.5);
  const [saved, setSaved] = useState(0);
  const [history, setHistory] = useState([]);
  const chipVal = amt === '₱500' ? 500 : amt === '₱2,500' ? 2500 : 1000;
  const customVal = parseFloat(custom);
  const val = custom.trim() && !isNaN(customVal) && customVal > 0 ? customVal : chipVal;

  const reload = () => {
    try {
      setWallet(getBalance());
      setSaved(getSavings());
      setHistory(
        getTransactions('').filter((t) => /savings/i.test(t.name)).slice(0, 5)
      );
    } catch (e) {}
  };
  useEffect(() => { reload(); const unsub = navigation.addListener('focus', reload); return unsub; }, [navigation]);

  const submit = () => {
    if (mode === 'deposit' && val > wallet)
      return Alert.alert('Insufficient wallet balance', `You have ${fmt(wallet)} available.`);
    if (mode === 'withdraw' && val > saved)
      return Alert.alert('Insufficient savings', `You have ${fmt(saved)} saved.`);
    if (mode === 'deposit') {
      try { const block = spendBlocked(val); if (block) return Alert.alert(block.title, block.msg); } catch (e) {}
    }
    const isDep = mode === 'deposit';
    let after = '';
    try {
      after = `\nWallet after: ${fmt(wallet + (isDep ? -val : val))}\nSavings after: ${fmt(saved + (isDep ? val : -val))}`;
    } catch (e) {}
    Alert.alert(
      isDep ? 'Confirm deposit' : 'Confirm withdrawal',
      `${fmt(val)} ${isDep ? 'wallet → savings' : 'savings → wallet'}?${after}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDep ? `Deposit ${fmt(val)}` : `Withdraw ${fmt(val)}`,
          onPress: () => {
            let newId = null;
            try {
              if (isDep) {
                newId = addTransactionGetId('Savings deposit', 'Wallet → savings', -val, 'expense', 'Today', 'shield');
                adjustBalance(-val);
                adjustSavings(val);
              } else {
                newId = addTransactionGetId('Savings withdrawal', 'Savings → wallet', val, 'income', 'Today', 'wallet');
                adjustBalance(val);
                adjustSavings(-val);
              }
            } catch (e) {
              return Alert.alert('Database error', String(e && e.message ? e.message : e));
            }
            setCustom('');
            reload();
            if (newId) navigation.navigate('Receipt', { id: newId });
            else navigation.navigate('Transactions');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.rowB}>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={20} /></TouchableOpacity>
        <Text style={s.h18}>Savings</Text>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="x" size={18} /></TouchableOpacity>
      </View>
      <LinearGradient colors={[T.primary, T.primary2]} style={s.balCard}>
        <Text style={s.pill}>3.0% p.a.</Text>
        <Text style={s.smallD}>Total saved</Text>
        <Text style={s.bal}>{fmt(saved)}</Text>
        <Text style={s.smallD}>Wallet available: {fmt(wallet)}</Text>
      </LinearGradient>
      <View style={s.chips3}>
        {['deposit', 'withdraw'].map((m) => (
          <TouchableOpacity key={m} style={[s.amtChip, mode === m && { backgroundColor: T.accent, flex: 1 }]} onPress={() => setMode(m)}>
            <Text style={s.amtChipT}>{m === 'deposit' ? 'Deposit' : 'Withdraw'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.cardColN}>
        <Text style={s.labSm}>Amount</Text>
        <Text style={s.bigAmt}>₱ {val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
      </View>
      <View style={s.chips3}>{['₱500', '₱1,000', '₱2,500'].map((a) => (
        <TouchableOpacity
          key={a}
          style={[s.amtChip, amt === a && !custom.trim() && { backgroundColor: T.accent }]}
          onPress={() => { setAmt(a); setCustom(''); }}
        >
          <Text style={s.amtChipT}>{a}</Text>
        </TouchableOpacity>
      ))}</View>
      <View style={s.noteRow}><Text style={{ fontSize: 16, fontFamily: F.b, color: T.muted }}>₱</Text><TextInput style={{ flex: 1, fontFamily: F.r }} placeholder="Or type custom amount" value={custom} onChangeText={setCustom} keyboardType="decimal-pad" /></View>
      <PayerBtn label={mode === 'deposit' ? 'Deposit' : 'Withdraw'} accent={mode === 'withdraw'} onPress={submit} />
      <View style={[s.cardColN, { marginTop: 12 }]}>
        <View style={s.rowB}><Text style={s.h16}>Recent savings moves</Text><TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={s.linkSm}>View all</Text></TouchableOpacity></View>
        {history.length === 0 ? (
          <Text style={s.small}>No deposits or withdrawals yet.</Text>
        ) : (
          history.map((t) => (
            <View key={t.id} style={s.txRow}>
              <View style={s.txIc}><Ic n={t.icon} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={s.txT}>{t.name}</Text><Text style={s.small}>{t.detail}</Text></View>
              <Text style={[s.amt, { color: t.amount < 0 ? T.red : T.green }]}>{t.amount < 0 ? '-' : '+'}{fmt(Math.abs(t.amount))}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

/* Buy Load — dedicated prepaid loader, all PH networks, prefix auto-detect */
const NETWORKS = [
  { id: 'smart', t: 'Smart', c: '#007A33', init: 'S' },
  { id: 'tnt', t: 'TNT', c: '#E4002B', init: 'T' },
  { id: 'globe', t: 'Globe', c: '#005EB8', init: 'G' },
  { id: 'tm', t: 'TM', c: '#78A22F', init: 'TM' },
  { id: 'dito', t: 'DITO', c: '#5B2D8E', init: 'D' },
];
const NET_PREFIX = {
  dito: ['0895', '0896', '0897', '0898', '0991', '0992', '0993'],
  tnt: ['0907', '0909', '0930', '0938', '0946', '0950', '0981'],
  smart: ['0908', '0910', '0911', '0912', '0913', '0914', '0918', '0919', '0920', '0921', '0928', '0929', '0939', '0947', '0948', '0949', '0951', '0998', '0999'],
  tm: ['0935', '0936', '0945', '0953', '0954', '0955', '0975', '0976'],
  globe: ['0905', '0906', '0915', '0916', '0917', '0926', '0927', '0937', '0956', '0965', '0966', '0967', '0977', '0995', '0996', '0997'],
};
const LOAD_AMOUNTS = ['₱10', '₱20', '₱50', '₱100', '₱500'];
function detectNetwork(num) {
  const pre = num.slice(0, 4);
  for (const n of NETWORKS) {
    if ((NET_PREFIX[n.id] || []).includes(pre)) return n.id;
  }
  return null;
}
function BuyLoad({ navigation }) {
  const [num, setNum] = useState('');
  const [net, setNet] = useState('smart');
  const [autoNet, setAutoNet] = useState(false);
  const [amt, setAmt] = useState('₱50');
  const [custom, setCustom] = useState('');
  const [history, setHistory] = useState([]);
  const lastPre = useRef('');
  const chipVal = { '₱10': 10, '₱20': 20, '₱50': 50, '₱100': 100, '₱500': 500 }[amt];
  const customVal = parseFloat(custom);
  const val = custom.trim() && !isNaN(customVal) && customVal > 0 ? customVal : chipVal;
  const picked = NETWORKS.find((n) => n.id === net);
  const reloadHist = () => {
    try { setHistory(getTransactions('').filter((t) => /^Load ·/.test(t.name)).slice(0, 3)); } catch (e) {}
  };
  useEffect(() => { reloadHist(); const unsub = navigation.addListener('focus', reloadHist); return unsub; }, [navigation]);

  const onNumChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setNum(digits);
    const pre = digits.slice(0, 4);
    if (digits.length >= 4 && pre !== lastPre.current) {
      lastPre.current = pre;
      const found = detectNetwork(digits);
      if (found) { setNet(found); setAutoNet(true); }
    }
    if (digits.length < 4) { lastPre.current = ''; setAutoNet(false); }
  };
  const validNum = /^09\d{9}$/.test(num);

  const submit = () => {
    if (!validNum) return Alert.alert('Invalid number', 'Enter an 11-digit mobile number starting with 09.');
    try { const block = spendBlocked(val); if (block) return Alert.alert(block.title, block.msg); } catch (e) {}
    let after = '';
    try { after = `\nBalance after: ${fmt(getBalance() - val)}`; } catch (e) {}
    Alert.alert('Confirm load', `${fmt(val)} ${picked.t} load to ${num}?${after}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: `Buy ${fmt(val)} load`,
        onPress: () => {
          let newId = null;
          try {
            newId = addTransactionGetId(`Load · ${picked.t} ${num}`, 'Prepaid load', -val, 'expense', 'Today', 'phone');
            adjustBalance(-val);
          } catch (e) {
            return Alert.alert('Database error', String(e && e.message ? e.message : e));
          }
          reloadHist();
          if (newId) navigation.navigate('Receipt', { id: newId });
          else navigation.navigate('Transactions');
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.rowB}>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={20} /></TouchableOpacity>
        <Text style={s.h18}>Buy Load</Text>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="x" size={18} /></TouchableOpacity>
      </View>
      <View style={s.cardColN}>
        <Text style={s.labSm}>Mobile number</Text>
        <View style={[s.field, num.length > 0 && !validNum && num.length === 11 ? { borderColor: T.red } : null]}>
          <Ic n="phone" size={18} color={T.muted} />
          <TextInput style={s.fieldT} placeholder="09XX XXX XXXX" value={num} onChangeText={onNumChange} keyboardType="number-pad" maxLength={11} />
        </View>
        {!validNum && num.length > 0 ? <Text style={[s.tiny, { color: T.red }]}>Must be 11 digits starting with 09</Text> : null}
        {autoNet ? <Text style={[s.tiny, { color: T.green }]}>Auto-detected: {picked.t} — tap below to change</Text> : null}
      </View>
      <Text style={[s.h16, { marginTop: 12 }]}>Network</Text>
      <View style={s.netGrid}>
        {NETWORKS.map((n) => {
          const on = net === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              style={[s.netCard, on && { borderColor: n.c, borderWidth: 2, backgroundColor: T.white }]}
              onPress={() => { setNet(n.id); setAutoNet(false); }}
            >
              <View style={[s.netBadge, { backgroundColor: n.c }]}><Text style={s.netInit}>{n.init}</Text></View>
              <Text style={s.txTsm}>{n.t}</Text>
              {on ? <Text style={[s.tiny, { color: T.green, fontFamily: F.b }]}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.cardColN}>
        <Text style={s.labSm}>Load amount</Text>
        <Text style={s.bigAmt}>₱ {val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
        <Text style={s.small}>{picked.t} prepaid · valid 3 days</Text>
      </View>
      <View style={s.loadChips}>{LOAD_AMOUNTS.map((a) => (
        <TouchableOpacity
          key={a}
          style={[s.amtChip, { flex: 1 }, amt === a && !custom.trim() && { backgroundColor: T.accent }]}
          onPress={() => { setAmt(a); setCustom(''); }}
        >
          <Text style={s.amtChipT}>{a}</Text>
        </TouchableOpacity>
      ))}</View>
      <View style={s.noteRow}><Text style={{ fontSize: 16, fontFamily: F.b, color: T.muted }}>₱</Text><TextInput style={{ flex: 1, fontFamily: F.r }} placeholder="Or type custom amount" value={custom} onChangeText={setCustom} keyboardType="decimal-pad" /></View>
      <View style={s.rowB}><Text style={s.feeT}>Load fee</Text><Text style={s.freeT}>Free</Text></View>
      <PayerBtn label="Buy Load" accent onPress={submit} />
      {history.length > 0 ? (
        <View style={[s.cardColN, { marginTop: 12 }]}>
          <View style={s.rowB}><Text style={s.h16}>Recent loads</Text><TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={s.linkSm}>View all</Text></TouchableOpacity></View>
          {history.map((t) => (
            <View key={t.id} style={s.txRow}>
              <View style={s.txIc}><Ic n="phone" size={18} /></View>
              <View style={{ flex: 1 }}><Text style={s.txT}>{t.name}</Text><Text style={s.small}>{t.detail}</Text></View>
              <Text style={[s.amt, { color: T.red }]}>-{fmt(Math.abs(t.amount))}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

/* Cash In — amount + method options, credits the wallet on confirm */
const CASHIN_AMOUNTS = ['₱500', '₱1,000', '₱2,500'];
const CASHIN_METHODS = [
  { id: 'bank', t: 'Bank Transfer', d: 'Linked ••4821 · Instant', ic: 'card' },
  { id: 'atm', t: 'ATM Deposit', d: 'Cash via Payer ATM · ~15 min', ic: 'pin' },
  { id: 'otc', t: 'Over-the-Counter', d: 'Partner outlets · ~1 hr', ic: 'receipt' },
];
function CashIn({ navigation }) {
  const [amt, setAmt] = useState('₱1,000');
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState('bank');
  const chipVal = amt === '₱500' ? 500 : amt === '₱2,500' ? 2500 : 1000;
  const customVal = parseFloat(custom);
  const val = custom.trim() && !isNaN(customVal) && customVal > 0 ? customVal : chipVal;
  const picked = CASHIN_METHODS.find((m) => m.id === method);
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.rowB}>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={20} /></TouchableOpacity>
        <Text style={s.h18}>Cash In</Text>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="x" size={18} /></TouchableOpacity>
      </View>
      <View style={s.cardColN}>
        <Text style={s.labSm}>Amount</Text>
        <Text style={s.bigAmt}>₱ {val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
        <Text style={s.small}>Free · arrives {picked.id === 'bank' ? 'instantly' : picked.d.split('·')[1].trim()}</Text>
      </View>
      <View style={s.chips3}>{CASHIN_AMOUNTS.map((a) => (
        <TouchableOpacity
          key={a}
          style={[s.amtChip, amt === a && !custom.trim() && { backgroundColor: T.accent }]}
          onPress={() => { setAmt(a); setCustom(''); }}
        >
          <Text style={s.amtChipT}>{a}</Text>
        </TouchableOpacity>
      ))}</View>
      <View style={s.noteRow}><Text style={{ fontSize: 16, fontFamily: F.b, color: T.muted }}>₱</Text><TextInput style={{ flex: 1, fontFamily: F.r }} placeholder="Or type custom amount" value={custom} onChangeText={setCustom} keyboardType="decimal-pad" /></View>
      <Text style={[s.h16, { marginTop: 12 }]}>How to cash in</Text>
      <View style={s.cardColN}>
        {CASHIN_METHODS.map((m) => {
          const on = method === m.id;
          return (
            <TouchableOpacity key={m.id} style={[s.billRow, on && { borderColor: T.primary, borderWidth: 2 }]} onPress={() => setMethod(m.id)}>
              <View style={[s.txIc, on && { backgroundColor: T.accent }]}><Ic n={m.ic} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={s.txT}>{m.t}</Text><Text style={s.small}>{m.d}</Text></View>
              <View style={[s.check, on ? { backgroundColor: T.primary, borderWidth: 0 } : { backgroundColor: T.white, borderWidth: 1.5, borderColor: T.border }]}>
                {on ? <Text style={{ color: '#fff', fontSize: 13, fontFamily: F.b }}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.rowB}><Text style={s.feeT}>Cash-in fee</Text><Text style={s.freeT}>Free</Text></View>
      <PayerBtn label="Cash In" accent onPress={() => {
        let after = '';
        try { after = `\nBalance after: ${fmt(getBalance() + val)}`; } catch (e) {}
        Alert.alert('Confirm cash in', `${fmt(val)} via ${picked.t}?${after}`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Cash in ${fmt(val)}`,
            onPress: () => {
              let newId = null;
              try {
                newId = addTransactionGetId(`Cash in · ${picked.t}`, 'Wallet top-up', val, 'income', 'Today', 'wallet');
                adjustBalance(val);
              } catch (e) {
                return Alert.alert('Database error', String(e && e.message ? e.message : e));
              }
              if (newId) navigation.navigate('Receipt', { id: newId });
              else navigation.navigate('Transactions');
            },
          },
        ]);
      }} />
    </ScrollView>
  );
}

/* 12 Rewards #1:46 */
function Rewards({ navigation }) {
  const [q, setQ] = useState('');
  const [points, setPoints] = useState(320);
  const [claimed, setClaimed] = useState({});
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '', address: '' });
  const [editVisible, setEditVisible] = useState(false);
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fMobile, setFMobile] = useState('');
  const [fAddress, setFAddress] = useState('');
  const loadProfile = () => {
    try { setProfile(getProfile()); } catch (e) {}
  };
  useEffect(() => { loadProfile(); const unsub = navigation.addListener('focus', loadProfile); return unsub; }, [navigation]);
  const openEdit = () => {
    setFName(profile.name); setFEmail(profile.email);
    setFMobile(profile.mobile); setFAddress(profile.address);
    setEditVisible(true);
  };
  const handleSave = () => {
    if (fName.trim().length < 2) return Alert.alert('Enter full name');
    if (!fEmail.includes('@')) return Alert.alert('Enter valid email');
    try {
      saveProfile(fName.trim(), fEmail.trim(), fMobile.trim(), fAddress.trim());
      loadProfile();
    } catch (e) {
      return Alert.alert('Database error', String(e && e.message ? e.message : e));
    }
    setEditVisible(false);
  };
  const setAvatar = (uri) => {
    try {
      saveProfile(profile.name, profile.email, profile.mobile, profile.address, uri);
      loadProfile();
    } catch (e) {
      Alert.alert('Database error', String(e && e.message ? e.message : e));
    }
  };
  const choosePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets && res.assets[0]) setAvatar(res.assets[0].uri);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets && res.assets[0]) setAvatar(res.assets[0].uri);
  };
  const photoOptions = () => {
    Alert.alert('Profile picture', 'Choose a photo', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: choosePhoto },
      ...(profile.avatar ? [{ text: 'Remove', style: 'destructive', onPress: () => setAvatar('') }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const pct = Math.round((points / 500) * 100);
  const promos = [
    { t: 'Coffee Cashback', d: '10% back' }, { t: 'Grocery Save', d: '5% off' },
    { t: 'Cinema Night', d: '2x pts' }, { t: 'Fitness Bonus', d: '15% off' },
    { t: 'Travel Perk', d: '20 pts' }, { t: 'Home Decor', d: '12% off' },
    { t: 'Tech Deal', d: '8% cashback' }, { t: 'Wellness Kit', d: '10 pts' },
    { t: 'Delivery Boost', d: '15% off' }, { t: 'Study Bundle', d: '12 pts' },
    { t: 'Pet Care', d: '8% off' }, { t: 'Gift Card', d: '5% bonus' },
  ].filter((p) => p.t.toLowerCase().includes(q.toLowerCase()));
  const claim = (p) => {
    if (claimed[p.t]) return;
    setClaimed({ ...claimed, [p.t]: true });
    setPoints((v) => Math.min(500, v + 10));
  };
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <StatusRow />
        <View style={s.cardColN}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={s.avatarWrap} onPress={photoOptions}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={s.avatarImg} />
              ) : (
                <View style={s.avBig}><UserIcon size={26} color={T.ink} /></View>
              )}
              <View style={s.camBadge}><Text style={s.camBadgeT}>📷</Text></View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.h16}>{profile.name || 'Your Name'}</Text>
              <Text style={s.small}>{profile.email || 'you@email.com'}</Text>
              {profile.mobile ? <Text style={s.small}>{profile.mobile}</Text> : null}
            </View>
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={s.editPill} onPress={openEdit}>
                <PencilIcon size={14} color={T.ink} /><Text style={s.pillTsm}> Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.editPill} onPress={() => navigation.navigate('MyQR')}>
                <Text style={s.pillTsm}>◈ QR</Text>
              </TouchableOpacity>
            </View>
          </View>
          {profile.address ? <Text style={s.small}>📍 {profile.address}</Text> : null}
        </View>
        <View style={s.cardColN}>
          <View style={s.rowB}>
            <View><Text style={s.small}>Payer Points</Text><Text style={s.h28}>{points} / 500</Text></View>
            <View style={s.starBox}><Ic n="star" size={20} /></View>
          </View>
          <View style={s.prog}><View style={[s.progFill, { width: `${pct}%` }]} /></View>
          <View style={s.rowB}><Text style={s.small}>{pct}% to next reward</Text><Text style={[s.small, { color: T.green, fontFamily: F.s }]}>{500 - points} points to go</Text></View>
        </View>
        <View style={s.rowB}><Text style={s.h20}>Rewards & promos</Text><View style={s.icon48}><Ic n="search" size={18} /></View></View>
        <View style={s.search}><Ic n="search" size={18} color={T.muted} /><TextInput style={{ flex: 1, fontFamily: F.r }} placeholder="Search rewards" value={q} onChangeText={setQ} /></View>
        {promos.length === 0 ? (
          <View style={s.emptyWrap}>
            <GiftIcon size={36} color={T.primary} />
            <Text style={s.h16}>No promos match</Text>
            <Text style={s.small}>Try a different search.</Text>
            <TouchableOpacity style={s.clearBtn} onPress={() => setQ('')}><Text style={s.claimT}>Clear search</Text></TouchableOpacity>
          </View>
        ) : (
        <View style={s.promoGrid}>{promos.map((p) => {
          const done = !!claimed[p.t];
          return (
            <View key={p.t} style={[s.promo, done && { opacity: 0.65 }]}>
              <View style={s.promoImg}><GiftIcon size={30} color={T.ink} /></View>
              <Text style={s.promoT}>{p.t}</Text><Text style={s.tiny}>{p.d}</Text>
              <TouchableOpacity style={[s.claim, done && { backgroundColor: T.primary2 }]} onPress={() => claim(p)}>
                <Text style={s.claimT}>{done ? 'Claimed' : 'Claim'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}</View>
        )}
      </ScrollView>
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={s.modalWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={s.modalCard}>
            <Text style={s.h16}>Edit profile</Text>
            <Text style={s.labSm}>Full name</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Jian Aguelo" value={fName} onChangeText={setFName} /></View>
            <Text style={s.labSm}>Email</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. jian@email.com" value={fEmail} onChangeText={setFEmail} autoCapitalize="none" keyboardType="email-address" /></View>
            <Text style={s.labSm}>Mobile</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. +63 912 345 6789" value={fMobile} onChangeText={setFMobile} keyboardType="phone-pad" /></View>
            <Text style={s.labSm}>Address</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Mati City, Davao Oriental" value={fAddress} onChangeText={setFAddress} /></View>
            <PayerBtn label="Save" onPress={handleSave} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setEditVisible(false)}><Text style={s.linkSm}>Cancel</Text></TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Tabs nav={navigation} active="Me" />
    </View>
  );
}

/* Receipt — full detail view for any transaction */
function Receipt({ navigation, route }) {
  const [tx, setTx] = useState(null);
  useEffect(() => {
    try {
      setTx(getTransactionById(route.params && route.params.id));
    } catch (e) {}
  }, [route.params && route.params.id]);
  if (!tx) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, padding: 16 }}>
        <StatusRow />
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={24} /></TouchableOpacity>
        <Text style={[s.h20, { marginTop: 16, textAlign: 'center' }]}>Receipt not found</Text>
        <Text style={[s.small, { textAlign: 'center' }]}>It may have been deleted.</Text>
      </View>
    );
  }
  const neg = tx.amount < 0;
  const ref = `PAYER-${String(tx.id).padStart(6, '0')}`;
  const rows = [
    ['Date', tx.detail],
    ['Type', tx.kind === 'income' ? 'Money in' : 'Payment'],
    ['Reference No.', ref],
    ['Transaction ID', String(tx.id)],
  ];
  const shareReceipt = () => {
    Share.share({
      message: `Payer Receipt\n${tx.name}\n${neg ? '-' : '+'}${fmt(Math.abs(tx.amount))}\n${tx.detail}\nReference: ${ref}\nStatus: Completed`,
    }).catch(() => {});
  };
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.rowB}>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={24} /></TouchableOpacity>
        <Text style={s.pill}>Completed</Text>
      </View>
      <Text style={[s.h28, { marginTop: 12 }]}>Receipt</Text>
      <Text style={[s.sub14, { marginBottom: 4 }]}>{ref}</Text>
      <View style={s.cardColN}>
        <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
          <View style={s.okRing}><Check size={30} color={T.green} /></View>
          <Text style={[s.h28, { color: neg ? T.red : T.green }]}>{neg ? '-' : '+'}{fmt(Math.abs(tx.amount))}</Text>
          <Text style={s.h16}>{tx.name}</Text>
          <Text style={s.small}>{tx.detail}</Text>
        </View>
        <View style={s.receiptDash} />
        {rows.map(([k, v]) => (
          <View key={k} style={s.kvRow}><Text style={s.small}>{k}</Text><Text style={s.txTsm}>{v}</Text></View>
        ))}
        <View style={s.receiptDash} />
        <View style={s.rowB}><Text style={s.h16}>Total</Text><Text style={s.h20}>{neg ? '-' : '+'}{fmt(Math.abs(tx.amount))}</Text></View>
      </View>
      <PayerBtn label="Share receipt" onPress={shareReceipt} />
      <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}><Text style={s.linkSm}>Done</Text></TouchableOpacity>
    </ScrollView>
  );
}

/* My QR — show code to be paid + log money received */
const QR_AMOUNTS = [0, 100, 500, 1000];
const RCV_AMOUNTS = ['₱100', '₱500', '₱1,000', '₱2,500'];
function MyQR({ navigation }) {
  const [profile, setProfile] = useState({ name: '', mobile: '' });
  const [tab, setTab] = useState('code');
  const [qrAmt, setQrAmt] = useState(0);
  const [sender, setSender] = useState('');
  const [ramt, setRamt] = useState('₱500');
  const [rcustom, setRcustom] = useState('');
  const [rnote, setRnote] = useState('');
  const [received, setReceived] = useState([]);
  const [totalIn, setTotalIn] = useState(0);
  const rchipVal = ramt === '₱100' ? 100 : ramt === '₱1,000' ? 1000 : ramt === '₱2,500' ? 2500 : 500;
  const rcustomVal = parseFloat(rcustom);
  const rval = rcustom.trim() && !isNaN(rcustomVal) && rcustomVal > 0 ? rcustomVal : rchipVal;
  const reloadAll = () => {
    try {
      setProfile(getProfile());
      const rows = getTransactions('');
      setReceived(rows.filter((t) => t.amount > 0).slice(0, 5));
      setTotalIn(getTotals().income);
    } catch (e) {}
  };
  useEffect(() => {
    reloadAll();
    const unsub = navigation.addListener('focus', reloadAll);
    return unsub;
  }, [navigation]);
  const payload = JSON.stringify({
    app: 'payer',
    v: 1,
    name: profile.name || '',
    mobile: profile.mobile || '',
    amount: qrAmt,
  });
  const shareQR = () => {
    Share.share({
      message: `Pay ${profile.name || 'me'} on Payer\n${profile.mobile || ''}${
        qrAmt > 0 ? `\nFixed amount: ${fmt(qrAmt)}` : ''
      }\nScan my QR in the app or send to my number.`,
    }).catch(() => {});
  };
  const confirmReceipt = () => {
    if (sender.trim().length < 2) return Alert.alert('Who paid you?', 'Enter the sender name for this receipt.');
    let after = '';
    try { after = `\nBalance after: ${fmt(getBalance() + rval)}`; } catch (e) {}
    Alert.alert('Confirm receipt', `Received ${fmt(rval)} from ${sender.trim()}?${after}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: `Receive ${fmt(rval)}`,
        onPress: () => {
          let newId = null;
          try {
            newId = addTransactionGetId(`Received · ${sender.trim()}`, rnote.trim() || 'QR receive', rval, 'income', 'Today', 'user');
            adjustBalance(rval);
          } catch (e) {
            return Alert.alert('Database error', String(e && e.message ? e.message : e));
          }
          setSender(''); setRcustom(''); setRnote('');
          reloadAll();
          if (newId) navigation.navigate('Receipt', { id: newId });
          else navigation.navigate('Transactions');
        },
      },
    ]);
  };
  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <StatusRow />
      <View style={s.rowB}>
        <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={24} /></TouchableOpacity>
        <Text style={s.pill}>Receive money</Text>
      </View>
      <Text style={[s.h28, { marginTop: 12 }]}>My QR</Text>
      <Text style={[s.sub14, { marginBottom: 4 }]}>Show your code, or log cash received.</Text>
      <View style={s.chips3}>
        {['code', 'receive'].map((t) => (
          <TouchableOpacity key={t} style={[s.amtChip, { flex: 1 }, tab === t && { backgroundColor: T.accent }]} onPress={() => setTab(t)}>
            <Text style={s.amtChipT}>{t === 'code' ? 'Show code' : 'Receive'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'code' ? (
        <View>
          <View style={s.cardColN}>
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <View style={s.qrBox}>
                <QRCode value={payload} size={200} color={T.ink} backgroundColor={T.white} />
              </View>
              <Text style={s.h16}>{profile.name || 'Your Name'}</Text>
              <Text style={s.small}>{profile.mobile || 'Add your mobile in Edit profile'}</Text>
              {qrAmt > 0 ? <Text style={s.pill}>Fixed: {fmt(qrAmt)}</Text> : <Text style={s.pill}>Any amount</Text>}
            </View>
            <Text style={s.labSm}>Fixed amount (optional)</Text>
            <View style={s.chips3}>
              {QR_AMOUNTS.map((a) => (
                <TouchableOpacity key={a} style={[s.amtChip, { flex: 1 }, qrAmt === a && { backgroundColor: T.accent }]} onPress={() => setQrAmt(a)}>
                  <Text style={s.amtChipT}>{a === 0 ? 'Any' : fmt(a)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <PayerBtn label="Share details" onPress={shareQR} />
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.navigate('ScanQR')}><Text style={s.linkSm}>Scan someone's QR instead</Text></TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={s.cardColN}>
            <View style={s.rowB}><Text style={s.h16}>Log money received</Text><Text style={s.pill}>+{fmt(totalIn)} in</Text></View>
            <Text style={s.labSm}>Sender name</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Ana Reyes" value={sender} onChangeText={setSender} /></View>
            <Text style={s.labSm}>Amount</Text>
            <Text style={s.bigAmt}>₱ {rval.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
            <View style={s.chips3}>{RCV_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[s.amtChip, { flex: 1 }, ramt === a && !rcustom.trim() && { backgroundColor: T.accent }]}
                onPress={() => { setRamt(a); setRcustom(''); }}
              >
                <Text style={s.amtChipT}>{a}</Text>
              </TouchableOpacity>
            ))}</View>
            <View style={s.noteRow}><Text style={{ fontSize: 16, fontFamily: F.b, color: T.muted }}>₱</Text><TextInput style={{ flex: 1, fontFamily: F.r }} placeholder="Or type custom amount" value={rcustom} onChangeText={setRcustom} keyboardType="decimal-pad" /></View>
            <Text style={s.labSm}>Note (optional)</Text>
            <View style={s.input48}><TextInput style={s.fieldT} placeholder="e.g. Paid back for lunch" value={rnote} onChangeText={setRnote} /></View>
          </View>
          <PayerBtn label="Confirm receipt" accent onPress={confirmReceipt} />
          <View style={[s.cardColN, { marginTop: 12 }]}>
            <View style={s.rowB}><Text style={s.h16}>Recently received</Text><TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={s.linkSm}>View all</Text></TouchableOpacity></View>
            {received.length === 0 ? (
              <Text style={s.small}>Nothing received yet.</Text>
            ) : (
              received.map((t) => (
                <TouchableOpacity key={t.id} style={s.txRow} onPress={() => navigation.navigate('Receipt', { id: t.id })}>
                  <View style={s.txIc}><Ic n={t.icon} size={18} /></View>
                  <View style={{ flex: 1 }}><Text style={s.txT}>{t.name}</Text><Text style={s.small}>{t.detail}</Text></View>
                  <Text style={[s.amt, { color: T.green }]}>+{fmt(Math.abs(t.amount))}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* Scan QR — camera scanner that prefills Send Money */
function ScanQR({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const scanned = useRef(false);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { scanned.current = false; });
    return unsub;
  }, [navigation]);
  const handleScan = ({ data }) => {
    if (scanned.current) return;
    scanned.current = true;
    let parsed = null;
    try { parsed = JSON.parse(data); } catch (e) {}
    if (parsed && parsed.app === 'payer') {
      navigation.navigate('SendMoney', {
        qrName: parsed.name || '',
        qrMobile: parsed.mobile || '',
        qrAmount: Number(parsed.amount) || 0,
      });
    } else {
      Alert.alert('Not a Payer code', String(data).slice(0, 200), [
        { text: 'Scan again', onPress: () => { scanned.current = false; } },
        { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
      ]);
    }
  };
  if (!permission) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}><ActivityIndicator /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={s.h20}>Camera access</Text>
        <Text style={[s.small, { textAlign: 'center' }]}>Allow the camera to scan Payer QR codes.</Text>
        <PayerBtn label="Allow camera" onPress={requestPermission} />
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}><Text style={s.linkSm}>Cancel</Text></TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={flash}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      >
        <View style={s.scanTop}>
          <TouchableOpacity style={s.icon48w} onPress={() => navigation.goBack()}><Ic n="x" size={20} /></TouchableOpacity>
          <Text style={s.scanTitle}>Scan to pay</Text>
          <TouchableOpacity style={s.icon48w} onPress={() => setFlash(!flash)}><Ic n="zap" size={20} /></TouchableOpacity>
        </View>
        <View style={s.scanCenter}>
          <View style={s.scanFrame} />
        </View>
        <Text style={s.scanHint}>Point at a Payer QR — amount and number fill in automatically.</Text>
      </CameraView>
    </View>
  );
}

/* Notifications inbox — every transaction as an activity notification */
function Notifications({ navigation }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const reload = () => {
    try {
      const rows = getTransactions('');
      setItems(rows);
      const map = {};
      rows.forEach((r) => { map[r.id] = true; });
      setUnread((prev) => {
        const kept = {};
        rows.forEach((r) => { if (!(r.id in prev)) kept[r.id] = true; else if (prev[r.id]) kept[r.id] = true; });
        return kept;
      });
    } catch (e) {
      Alert.alert('Database error', String(e && e.message ? e.message : e));
    }
  };
  useEffect(() => { reload(); const unsub = navigation.addListener('focus', reload); return unsub; }, [navigation]);
  const unreadCount = Object.values(unread).filter(Boolean).length;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); setRefreshing(false); }} tintColor={T.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.txRow} onPress={() => navigation.navigate('Receipt', { id: item.id })}>
            <View style={[s.txIc, { backgroundColor: unread[item.id] ? T.accent : T.primary2 }]}>
              <Ic n={item.icon} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txT}>{item.name}</Text>
              <Text style={s.small}>{item.detail}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={[s.amt, { color: item.amount < 0 ? T.red : T.green }]}>
                {item.amount < 0 ? '-' : '+'}{fmt(Math.abs(item.amount))}
              </Text>
              {unread[item.id] ? <View style={s.dot} /> : null}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <StatusRow />
            <View style={s.rowB}>
              <TouchableOpacity style={s.icon48} onPress={() => navigation.goBack()}><Ic n="back" size={24} /></TouchableOpacity>
              <Text style={[s.pill, unreadCount ? {} : { backgroundColor: T.primary2 }]}>{unreadCount ? `${unreadCount} new` : 'All caught up'}</Text>
            </View>
            <Text style={[s.h28, { marginTop: 12 }]}>Notifications</Text>
            <View style={s.rowB}>
              <Text style={s.sub14}>Money activity from your ledger.</Text>
              {unreadCount ? (
                <TouchableOpacity onPress={() => setUnread({})}><Text style={s.linkSm}>Mark all read</Text></TouchableOpacity>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={[s.small, { textAlign: 'center', marginTop: 32 }]}>No activity yet — send money or pay a bill.</Text>}
      />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  useEffect(() => {
    try {
      initDatabase();
    } catch (e) {
      console.warn('SQLite init failed', e);
    }
  }, []);
  if (!loaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Verify" component={Verify} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Atms" component={Atms} />
        <Stack.Screen name="Transactions" component={Transactions} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="MyQR" component={MyQR} />
        <Stack.Screen name="ScanQR" component={ScanQR} />
        <Stack.Screen name="Receipt" component={Receipt} />
        <Stack.Screen name="FindBranch" component={FindBranch} />
        <Stack.Screen name="Services" component={Services} />
        <Stack.Screen name="MyCard" component={MyCard} />
        <Stack.Screen name="PayBills" component={PayBills} />
        <Stack.Screen name="SendMoney" component={SendMoney} />
        <Stack.Screen name="CashIn" component={CashIn} />
        <Stack.Screen name="BuyLoad" component={BuyLoad} />
        <Stack.Screen name="Savings" component={Savings} />
        <Stack.Screen name="Rewards" component={Rewards} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  status: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
  statusT: { fontFamily: F.s, fontSize: 14, color: T.ink },
  statusT2: { fontFamily: F.r, fontSize: 11, color: T.ink },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { flexDirection: 'row', backgroundColor: T.white, borderColor: T.border2, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  chipSm: { flexDirection: 'row', backgroundColor: T.white, borderColor: T.border2, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: 'center' },
  chipT: { fontFamily: F.s, fontSize: 14, color: T.ink },
  chipT2: { fontFamily: F.s, fontSize: 13, color: T.muted },
  dot24: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.green },
  receiptDash: { borderTopWidth: 1, borderColor: T.border, borderStyle: 'dashed', marginVertical: 12 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  okRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.greenBg, alignItems: 'center', justifyContent: 'center' },
  qrBox: { backgroundColor: T.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  scanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 48 },
  scanTitle: { fontFamily: F.b, fontSize: 18, color: '#fff' },
  scanCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: T.accent, backgroundColor: 'transparent' },
  scanHint: { fontFamily: F.r, fontSize: 13, color: '#fff', textAlign: 'center', padding: 24 },
  logoRing: { width: 220, height: 220, borderRadius: 110, backgroundColor: T.white, borderWidth: 2, borderColor: T.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A', shadowOpacity: 0.07, shadowRadius: 24, elevation: 4 },
  logoIn: { width: 176, height: 176, borderRadius: 88, alignItems: 'center', justifyContent: 'center' },
  miniBadge: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: T.white, borderWidth: 1, borderColor: T.border2, alignItems: 'center', justifyContent: 'center' },
  miniBadgeSm: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, borderWidth: 1, borderColor: T.border2, alignItems: 'center', justifyContent: 'center' },
  miniBadgeMd: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: T.white, borderWidth: 1, borderColor: T.border2, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: F.b, fontSize: 34, color: T.ink, textAlign: 'center', marginTop: 16 },
  heroSub: { fontFamily: F.r, fontSize: 16, color: T.muted, textAlign: 'center' },
  btn: { height: 56, borderRadius: 20, marginTop: 12, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
  btnInner: { flex: 1, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnT: { fontFamily: F.b, fontSize: 16, color: T.ink },
  small: { fontFamily: F.r, fontSize: 13, color: T.muted, marginTop: 2 },
  smallD: { fontFamily: F.r, fontSize: 13, color: T.ink, marginTop: 2 },
  sub14: { fontFamily: F.r, fontSize: 14, color: T.muted },
  sub13: { fontFamily: F.r, fontSize: 13, color: T.muted },
  h28: { fontFamily: F.b, fontSize: 28, color: T.ink },
  h26: { fontFamily: F.b, fontSize: 26, color: T.ink },
  h24: { fontFamily: F.b, fontSize: 24, color: T.ink },
  h22: { fontFamily: F.b, fontSize: 22, color: T.ink },
  h20: { fontFamily: F.b, fontSize: 20, color: T.ink },
  h18: { fontFamily: F.b, fontSize: 18, color: T.ink },
  h16: { fontFamily: F.b, fontSize: 16, color: T.ink },
  h15: { fontFamily: F.b, fontSize: 15, color: T.ink },
  h14: { fontFamily: F.b, fontSize: 14, color: T.ink },
  h13: { fontFamily: F.b, fontSize: 13, color: T.ink },
  lab: { fontFamily: F.s, fontSize: 14, color: T.muted, marginTop: 12, marginBottom: 6 },
  labSm: { fontFamily: F.s, fontSize: 12, color: T.ink },
  field: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 20, height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldT: { flex: 1, fontFamily: F.r, fontSize: 16, color: T.ink },
  input48: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.primary, borderRadius: 16, height: 48, paddingHorizontal: 14, justifyContent: 'center', marginTop: 6 },
  hero176: { minHeight: 176, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, padding: 24, gap: 4 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillW: { flexDirection: 'row', backgroundColor: T.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start' },
  pillWT: { fontFamily: F.s, fontSize: 12, color: T.ink },
  strength: { flexDirection: 'row', gap: 4, marginTop: 8, backgroundColor: T.track, borderRadius: 99, padding: 2 },
  sbar: { height: 6, borderRadius: 99, flex: 1 },
  agree: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#CBD5DD', alignItems: 'center', justifyContent: 'center' },
  google: { marginTop: 14, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  googleT: { fontFamily: F.s, fontSize: 15, color: T.ink },
  cardCol: { backgroundColor: T.white, borderRadius: 20, padding: 20, gap: 8, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  cardColN: { backgroundColor: T.white, borderRadius: 20, borderWidth: 1, borderColor: T.border3, padding: 14, marginVertical: 6, gap: 8 },
  pill: { backgroundColor: T.accent, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, fontFamily: F.b, fontSize: 12, color: T.ink, alignSelf: 'flex-start' },
  pillT: { fontFamily: F.b, fontSize: 12, color: T.ink },
  pillSm: { backgroundColor: T.accent, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, fontFamily: F.b, fontSize: 11, color: T.ink },
  pillD: { backgroundColor: T.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, fontFamily: F.s, fontSize: 13, color: T.ink },
  pillTsm: { fontFamily: F.s, fontSize: 11, color: T.ink },
  otpRow: { flexDirection: 'row', gap: 8, marginVertical: 8, justifyContent: 'space-between' },
  otp: { width: 66, height: 64, borderRadius: 16, backgroundColor: T.white, borderWidth: 1, borderColor: T.border4, alignItems: 'center', justifyContent: 'center', flex: 1 },
  otpT: { fontFamily: F.b, fontSize: 28, color: T.ink },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.border4, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  timerT: { fontFamily: F.s, fontSize: 12, color: T.ink },
  rowB: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  rowB2: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  key: { width: '31%', height: 56, backgroundColor: T.white, borderWidth: 1, borderColor: T.border4, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyT: { fontFamily: F.s, fontSize: 22, color: T.ink },
  search: { backgroundColor: T.white, borderRadius: 16, height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  searchTall: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 20, height: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  balCard: { borderRadius: 20, padding: 16, gap: 4, marginVertical: 8 },
  showPill: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  bal: { fontFamily: F.b, fontSize: 28, color: T.ink },
  bigAmt: { fontFamily: F.b, fontSize: 34, color: T.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid3: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  qa: { width: '31%', backgroundColor: T.white, borderRadius: 20, borderWidth: 1, borderColor: T.border3, padding: 12, gap: 6, minHeight: 72 },
  qaIc: { width: 32, height: 32, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qaT: { fontFamily: F.b, fontSize: 11, color: T.ink },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'flex-end' },
  chartBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  chartCol: { alignItems: 'center', gap: 4, flex: 1 },
  chartVal: { fontFamily: F.s, fontSize: 10, color: T.muted },
  barV: { width: 28, backgroundColor: T.primary2, borderRadius: 6 },
  tiny: { fontFamily: F.r, fontSize: 10, color: T.muted },
  linkSm: { fontFamily: F.s, fontSize: 12, color: T.ink },
  tabWrap: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  tabs: { flexDirection: 'row', backgroundColor: T.white, borderRadius: 20, padding: 8, gap: 8, shadowColor: '#1F2D3A', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabBox: { width: 48, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabL: { fontFamily: F.m, fontSize: 10, color: T.muted },
  homeBar: { width: 108, height: 4, borderRadius: 2, backgroundColor: T.primary, alignSelf: 'center', marginTop: 16 },
  heroAuto: { padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, gap: 6 },
  map: { height: 330, backgroundColor: '#E6EDF3', margin: 16, marginBottom: 0, borderRadius: 18, overflow: 'hidden' },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.2, backgroundColor: '#D7E1E8' },
  chipsAbs: { position: 'absolute', top: 64, left: 12, flexDirection: 'row', gap: 8 },
  zoomCol: { position: 'absolute', right: 12, top: 110, gap: 8 },
  zoomBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  zoomT: { fontFamily: F.b, fontSize: 22, color: T.ink, lineHeight: 24 },
  mapHint: { position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  mapHintT: { fontFamily: F.s, fontSize: 12, color: T.ink },
  mapHintBtn: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  fchip: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  fchipT: { fontFamily: F.s, fontSize: 13, color: T.ink },
  mapPin: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapPinBig: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  mapBadge: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  badgeT: { fontFamily: F.b, fontSize: 12, color: T.ink },
  sheet: { backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10, marginTop: -20 },
  grab: { width: 48, height: 5, borderRadius: 99, backgroundColor: '#D7E0E8', alignSelf: 'center' },
  atmPhoto: { width: 88, height: 88, borderRadius: 20, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#D7E0E8' },
  txHero: { borderRadius: 20, padding: 12, gap: 4 },
  filterPill: { flexDirection: 'row', backgroundColor: T.white, borderRadius: 16, padding: 8, gap: 6, alignItems: 'center' },
  addPill: { flexDirection: 'row', backgroundColor: T.accent, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 4, alignItems: 'center' },
  editPill: { flexDirection: 'row', backgroundColor: T.accent, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 4, alignItems: 'center' },
  delBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: T.redBg, alignItems: 'center', justifyContent: 'center' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(31,45,58,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 4 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  tabs4: { flexDirection: 'row', gap: 4 },
  tab4: { flex: 1, height: 48, borderRadius: 16, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center' },
  tab4T: { fontFamily: F.s, fontSize: 13, color: T.ink },
  sum: { flex: 1, backgroundColor: T.white, borderRadius: 20, padding: 12, gap: 6, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 18, elevation: 2 },
  sumIc: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  dateH: { fontFamily: F.b, fontSize: 10, color: T.muted },
  txRow: { backgroundColor: T.white, borderRadius: 18, padding: 12, marginVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: T.border3 },
  txIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  txT: { fontFamily: F.s, fontSize: 15, color: T.ink },
  txTsm: { fontFamily: F.s, fontSize: 13, color: T.ink },
  amt: { marginLeft: 'auto', fontFamily: F.b, fontSize: 14 },
  atmLink: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  icon48: { width: 48, height: 48, borderRadius: 20, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: 6, right: 6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: T.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  bellBadgeT: { fontFamily: F.b, fontSize: 11, color: T.white },
  emptyWrap: { alignItems: 'center', gap: 6, paddingVertical: 32 },
  clearBtn: { backgroundColor: T.accent, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  icon48w: { width: 48, height: 48, borderRadius: 20, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center' },
  pinY: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  branch: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 20, minHeight: 72, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  open: { backgroundColor: T.greenBg, color: T.green, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 6, fontFamily: F.s, fontSize: 9, overflow: 'hidden' },
  closed: { backgroundColor: T.redBg, color: T.red, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 6, fontFamily: F.s, fontSize: 9, overflow: 'hidden' },
  callBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  mapCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  mapCtaBtn: { flexDirection: 'row', height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  branchCta: { flexDirection: 'row', borderRadius: 20, padding: 14, alignItems: 'center', gap: 12 },
  branchCtaIc: { width: 48, height: 48, borderRadius: 16, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  miniMap: { height: 200, backgroundColor: '#E6EDF3', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  pinBubble: { position: 'absolute', bottom: 48, backgroundColor: T.white, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: T.border, shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  pinBubbleT: { fontFamily: F.s, fontSize: 11, color: T.ink },
  branchHero: { borderRadius: 20, padding: 18, gap: 4, marginBottom: 4 },
  branchCard: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 20, padding: 12, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  roadH: { position: 'absolute', left: 0, right: 0, top: 88, height: 14, backgroundColor: T.white, opacity: 0.85 },
  roadV: { position: 'absolute', top: 0, bottom: 0, left: 150, width: 12, backgroundColor: T.white, opacity: 0.85 },
  roadD: { position: 'absolute', left: 40, top: 20, width: 200, height: 10, backgroundColor: T.white, opacity: 0.6, borderRadius: 5, transform: [{ rotate: '18deg' }] },
  svcHero: { borderRadius: 20, padding: 12, gap: 4, backgroundColor: 'rgba(174,196,212,0.18)', borderWidth: 1, borderColor: T.border },
  svc: { flex: 1, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 8, gap: 6, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  svcIc: { width: 32, height: 32, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  svcIcSm: { width: 32, height: 32, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  promoBig: { borderRadius: 20, padding: 12, gap: 10, marginTop: 8, minHeight: 112, justifyContent: 'space-between' },
  claimSm: { backgroundColor: T.accent, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  claimT: { fontFamily: F.s, fontSize: 12, color: T.ink },
  offer: { width: '48%', backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 8, gap: 4, minHeight: 96 },
  bankCard: { borderRadius: 22, padding: 18, gap: 6 },
  chipSim: { width: 48, height: 32, borderRadius: 8, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  activePill: { backgroundColor: T.accent, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, fontFamily: F.s, fontSize: 12, color: T.ink, overflow: 'hidden' },
  cardNum: { fontFamily: F.r, fontSize: 13, color: T.muted },
  ctlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, borderRadius: 16, padding: 8 },
  ctlRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.bg, borderRadius: 16, padding: 8 },
  tog: { width: 44, height: 24, borderRadius: 99, backgroundColor: T.primary, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: T.white },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: T.border4, borderRadius: 16, padding: 12, marginTop: 8 },
  due: { backgroundColor: T.accent, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, fontFamily: F.b, fontSize: 12, color: T.ink, alignSelf: 'flex-start', marginTop: 4, overflow: 'hidden' },
  dueRed: { backgroundColor: T.redBg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, fontFamily: F.b, fontSize: 12, color: T.red, alignSelf: 'flex-start', marginTop: 4, overflow: 'hidden' },
  addBillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: T.border, borderStyle: 'dashed', borderRadius: 16, padding: 12, marginTop: 8 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 8, backgroundColor: 'transparent' },
  totalBar: { borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentMain: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.bg, borderRadius: 16, padding: 8 },
  avBig: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  av: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#C9D9E5', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  camBadge: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: T.accent, borderWidth: 2, borderColor: T.white, alignItems: 'center', justifyContent: 'center' },
  camBadgeT: { fontSize: 12 },
  avT: { fontFamily: F.s, fontSize: 14, color: T.ink },
  chips3: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  amtChip: { flex: 1, height: 48, borderRadius: 24, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  amtChipT: { fontFamily: F.s, fontSize: 14, color: T.ink },
  noteRow: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 16, height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feeT: { fontFamily: F.m, fontSize: 13, color: T.muted },
  freeT: { fontFamily: F.s, fontSize: 13, color: T.green },
  prog: { height: 10, backgroundColor: T.track2, borderRadius: 5, marginTop: 8 },
  progFill: { height: 10, backgroundColor: T.primary, borderRadius: 5 },
  starBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  netGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  netCard: { width: '31%', backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 10, gap: 6, alignItems: 'center' },
  netBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  netInit: { fontFamily: F.b, fontSize: 14, color: T.white },
  loadChips: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  promoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  promo: { width: '48%', backgroundColor: T.white, borderRadius: 20, borderWidth: 1, borderColor: T.border, padding: 8, gap: 6 },
  promoImg: { height: 56, borderRadius: 14, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  promoT: { fontFamily: F.s, fontSize: 11, color: T.ink },
  claim: { height: 48, borderRadius: 16, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
});
