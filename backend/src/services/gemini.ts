import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product';
import User from '../models/User';
import Order from '../models/Order';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function geminiChat(message: string, context?: any) {
  try {
    console.log(`AI Chat: Processing message - "${message}"`);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get all products from the database to provide real recommendations
    const allProducts = await Product.find().populate('seller', 'name').limit(50);
    console.log(`AI Chat: Loaded ${allProducts.length} products for recommendations`);

    // Create product catalog for AI
    const productCatalog = allProducts.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      seller: p.seller?.name || 'ExCom Seller',
      keywords: `${p.title} ${p.description} ${p.category}`.toLowerCase()
    }));

    // Analyze the message to detect if user is looking for specific products
    const isProductQuery = /\b(looking for|need|want|search|find|buy|recommend|suggest|show me|camera|laptop|phone|headphones|shoes|clothes|electronics|furniture|book|toy|bag|watch|tablet|computer|mouse|keyboard|monitor|speaker|earphone|charger|cable|adapter|case|cover|holder|stand|mount|light|lamp|bulb|fan|heater|cooler|blender|mixer|grinder|toaster|oven|microwave|fridge|freezer|washer|dryer|vacuum|cleaner|mop|broom|bucket|basket|chair|table|sofa|bed|mattress|pillow|blanket|curtain|carpet|rug|mirror|frame|clock|plant|pot|vase|candle|perfume|soap|shampoo|cream|lotion|makeup|brush|comb|razor|trimmer|toothbrush|toothpaste|medicine|vitamin|supplement|protein|powder|bar|bottle|cup|mug|plate|bowl|spoon|fork|knife|pan|pot|spatula|tongs|ladle|strainer|grater|peeler|opener|cutter|slicer|scale|timer|thermometer|glove|apron|towel|cloth|sponge|detergent|bleach|softener|stain|remover|air|freshener|spray|gel|wipe|tissue|paper|pen|pencil|marker|highlighter|eraser|ruler|stapler|clip|folder|binder|notebook|diary|calendar|calculator|battery|charger|cable|wire|adapter|converter|transformer|switch|socket|plug|extension|strip|surge|protector|ups|stabilizer|inverter|generator|motor|pump|valve|pipe|hose|tap|faucet|sink|basin|toilet|shower|bath|tub|tiles|paint|brush|roller|ladder|drill|hammer|screwdriver|wrench|pliers|saw|cutter|knife|blade|sandpaper|glue|tape|rope|chain|lock|key|handle|knob|hinge|screw|nail|bolt|nut|washer|bracket|hook|clamp|magnet|spring|gear|bearing|pulley|belt|wheel|tire|tube|pump|gauge|meter|sensor|detector|alarm|camera|lens|flash|tripod|memory|card|sd|usb|hard|drive|ssd|ram|processor|cpu|gpu|motherboard|power|supply|cooling|thermal|paste|fan|heater|radiator|filter|purifier|humidifier|dehumidifier|ionizer|ozone|uv|sterilizer|sanitizer|disinfectant|mask|gloves|shield|goggles|helmet|cap|hat|scarf|belt|wallet|purse|backpack|suitcase|luggage|travel|bag|organizer|pouch|case|cover|sleeve|protector|screen|guard|skin|decal|sticker|label|tag|badge|pin|button|zipper|velcro|elastic|thread|needle|scissors|fabric|leather|plastic|metal|wood|glass|ceramic|stone|marble|granite|concrete|cement|sand|gravel|brick|tile|plank|panel|sheet|board|beam|rod|tube|pipe|wire|cable|string|rope|chain|mesh|net|filter|screen|barrier|fence|gate|door|window|frame|glass|mirror|lens|prism|crystal|diamond|gem|stone|rock|mineral|ore|coal|oil|gas|fuel|energy|solar|wind|hydro|electric|magnetic|acoustic|optical|thermal|chemical|biological|mechanical|electronic|digital|analog|automatic|manual|remote|wireless|bluetooth|wifi|internet|network|router|modem|switch|hub|repeater|extender|booster|amplifier|antenna|satellite|dish|receiver|transmitter|transceiver|scanner|printer|copier|fax|projector|screen|display|monitor|tv|radio|speaker|microphone|headphone|earphone|headset|gaming|console|controller|joystick|keyboard|mouse|touchpad|trackball|stylus|tablet|ipad|android|ios|windows|mac|linux|software|app|game|music|video|movie|photo|image|document|file|folder|archive|backup|cloud|storage|sync|share|download|upload|stream|broadcast|podcast|ebook|audiobook|magazine|newspaper|journal|blog|website|email|message|chat|call|video|conference|meeting|presentation|slide|template|theme|font|color|style|design|logo|banner|poster|flyer|brochure|card|invitation|ticket|voucher|coupon|gift|reward|points|cashback|discount|sale|offer|deal|promotion|bundle|package|combo|set|kit|collection|series|edition|version|model|type|size|weight|dimension|height|width|length|depth|thickness|diameter|radius|circumference|area|volume|capacity|speed|power|voltage|current|resistance|frequency|temperature|pressure|humidity|ph|concentration|density|viscosity|hardness|softness|flexibility|durability|strength|weakness|quality|grade|rating|review|feedback|opinion|comment|suggestion|recommendation|advice|tip|guide|tutorial|manual|instruction|help|support|service|warranty|guarantee|insurance|protection|security|safety|privacy|confidentiality|anonymity|transparency|honesty|integrity|reliability|trustworthiness|credibility|authenticity|originality|uniqueness|innovation|creativity|artistry|craftsmanship|skill|expertise|experience|knowledge|wisdom|intelligence|smartness|cleverness|ingenuity|resourcefulness|adaptability|flexibility|versatility|efficiency|effectiveness|productivity|performance|speed|accuracy|precision|consistency|stability|balance|harmony|symmetry|proportion|scale|perspective|depth|dimension|texture|pattern|design|style|fashion|trend|culture|tradition|heritage|history|legacy|evolution|development|progress|improvement|enhancement|upgrade|update|modification|customization|personalization|individualization|specialization|generalization|standardization|normalization|optimization|maximization|minimization|reduction|increase|growth|expansion|extension|addition|subtraction|multiplication|division|calculation|computation|analysis|synthesis|evaluation|assessment|measurement|estimation|approximation|comparison|contrast|similarity|difference|distinction|classification|categorization|organization|arrangement|sorting|ranking|priority|importance|significance|relevance|applicability|suitability|appropriateness|fitness|compatibility|consistency|coherence|logic|reason|rationale|justification|explanation|clarification|interpretation|understanding|comprehension|awareness|consciousness|perception|observation|attention|focus|concentration|meditation|relaxation|stress|tension|pressure|anxiety|worry|concern|fear|doubt|uncertainty|confusion|complexity|simplicity|ease|difficulty|challenge|problem|solution|answer|question|inquiry|investigation|research|study|experiment|test|trial|error|mistake|failure|success|achievement|accomplishment|goal|objective|target|aim|purpose|intention|plan|strategy|tactic|method|approach|technique|procedure|process|system|mechanism|structure|framework|architecture|design|layout|arrangement|organization|management|administration|governance|leadership|authority|power|control|influence|impact|effect|consequence|result|outcome|output|input|throughput|bandwidth|capacity|limit|boundary|threshold|range|scope|scale|size|magnitude|extent|degree|level|stage|phase|step|progression|sequence|order|priority|hierarchy|chain|network|web|mesh|grid|matrix|table|list|array|vector|set|group|cluster|collection|aggregation|accumulation|compilation|assembly|construction|creation|generation|production|manufacturing|fabrication|building|making|crafting|forming|shaping|molding|casting|forging|welding|soldering|brazing|gluing|bonding|joining|connecting|linking|attaching|mounting|installing|setting|placing|positioning|locating|finding|searching|seeking|hunting|looking|watching|observing|monitoring|tracking|following|tracing|detecting|discovering|identifying|recognizing|distinguishing|differentiating|discriminating|selecting|choosing|picking|deciding|determining|concluding|inferring|deducing|reasoning|thinking|processing|computing|calculating|analyzing|evaluating|judging|assessing|measuring|testing|checking|verifying|validating|confirming|proving|demonstrating|showing|displaying|presenting|exhibiting|revealing|exposing|uncovering|discovering|exploring|investigating|researching|studying|learning|teaching|training|coaching|mentoring|guiding|advising|counseling|consulting|helping|assisting|supporting|serving|providing|offering|giving|donating|contributing|sharing|distributing|delivering|transporting|moving|carrying|lifting|pulling|pushing|dragging|rolling|sliding|rotating|turning|spinning|twisting|bending|folding|unfolding|opening|closing|locking|unlocking|fastening|unfastening|tying|untying|binding|unbinding|wrapping|unwrapping|packing|unpacking|loading|unloading|filling|emptying|pouring|draining|flowing|streaming|leaking|dripping|splashing|spraying|sprinkling|dusting|wiping|cleaning|washing|rinsing|drying|heating|cooling|freezing|melting|boiling|steaming|evaporating|condensing|crystallizing|dissolving|mixing|blending|stirring|shaking|vibrating|oscillating|pulsating|beating|tapping|knocking|hitting|striking|banging|crashing|smashing|breaking|cracking|splitting|cutting|slicing|chopping|grinding|crushing|squeezing|pressing|compressing|expanding|stretching|extending|contracting|shrinking|growing|swelling|inflating|deflating|pumping|sucking|blowing|breathing|inhaling|exhaling|coughing|sneezing|yawning|sleeping|waking|dreaming|thinking|feeling|sensing|touching|holding|grasping|gripping|releasing|letting|dropping|catching|throwing|tossing|casting|shooting|firing|launching|sending|receiving|getting|taking|giving|putting|placing|setting|laying|resting|sitting|standing|walking|running|jumping|climbing|crawling|swimming|diving|flying|soaring|gliding|floating|sinking|submerging|emerging|surfacing|landing|taking|off|departing|arriving|coming|going|leaving|staying|remaining|waiting|pausing|stopping|starting|beginning|ending|finishing|completing|continuing|proceeding|advancing|retreating|returning|coming|back|going|forward|backward|upward|downward|leftward|rightward|inward|outward|clockwise|counterclockwise|horizontally|vertically|diagonally|straight|curved|zigzag|spiral|circular|elliptical|oval|round|square|rectangular|triangular|pentagonal|hexagonal|octagonal|polygonal|linear|angular|radial|concentric|eccentric|symmetric|asymmetric|regular|irregular|uniform|varied|constant|variable|fixed|movable|static|dynamic|stable|unstable|balanced|unbalanced|centered|off-center|aligned|misaligned|parallel|perpendicular|intersecting|diverging|converging|meeting|crossing|overlapping|separate|apart|together|united|divided|connected|disconnected|linked|unlinked|related|unrelated|similar|different|same|identical|unique|common|rare|frequent|infrequent|regular|irregular|normal|abnormal|standard|nonstandard|typical|atypical|usual|unusual|ordinary|extraordinary|simple|complex|basic|advanced|elementary|sophisticated|primitive|modern|ancient|old|new|fresh|stale|young|mature|early|late|soon|delayed|immediate|instant|gradual|sudden|slow|fast|quick|rapid|speedy|swift|sluggish|lazy|active|passive|busy|idle|working|resting|moving|still|quiet|loud|silent|noisy|soft|hard|smooth|rough|flat|bumpy|even|uneven|level|slanted|steep|gentle|sharp|dull|bright|dim|light|dark|colorful|colorless|vivid|faded|transparent|opaque|clear|cloudy|pure|impure|clean|dirty|fresh|stale|sweet|bitter|sour|salty|spicy|bland|hot|cold|warm|cool|dry|wet|moist|humid|arid|fertile|barren|rich|poor|expensive|cheap|costly|affordable|valuable|worthless|precious|common|rare|scarce|abundant|plenty|few|many|some|all|none|everything|nothing|something|anything|somewhere|anywhere|nowhere|everywhere|someone|anyone|no one|everyone|somebody|anybody|nobody|everybody|sometime|anytime|never|always|sometimes|often|rarely|seldom|frequently|occasionally|regularly|irregularly|continuously|intermittently|constantly|variably|permanently|temporarily|briefly|momentarily|instantly|immediately|soon|later|eventually|finally|ultimately|initially|originally|firstly|secondly|thirdly|lastly|previously|formerly|currently|presently|recently|lately|nowadays|today|tomorrow|yesterday|now|then|here|there|everywhere|somewhere|anywhere|nowhere|inside|outside|within|without|above|below|over|under|on|off|in|out|up|down|left|right|front|back|near|far|close|distant|beside|next|adjacent|opposite|across|through|around|beyond|behind|ahead|forward|backward|sideways|upward|downward|inward|outward|toward|away|from|to|into|onto|upon|against|with|without|by|via|through|across|over|under|around|about|concerning|regarding|respecting|considering|including|excluding|except|besides|apart|from|aside|from|along|with|together|with|as|well|as|in|addition|to|moreover|furthermore|besides|also|too|either|neither|nor|or|and|but|yet|however|nevertheless|nonetheless|still|though|although|even|if|unless|until|while|when|where|why|how|what|which|who|whom|whose|that|this|these|those|such|so|very|quite|rather|fairly|pretty|somewhat|slightly|barely|hardly|scarcely|almost|nearly|practically|virtually|essentially|basically|fundamentally|primarily|mainly|mostly|largely|generally|usually|typically|normally|commonly|frequently|often|regularly|routinely|habitually|customarily|traditionally|conventionally|officially|formally|informally|casually|seriously|playfully|jokingly|humorously|sarcastically|ironically|literally|figuratively|metaphorically|symbolically|realistically|ideally|theoretically|practically|hypothetically|potentially|possibly|probably|likely|unlikely|certainly|definitely|absolutely|positively|surely|undoubtedly|clearly|obviously|evidently|apparently|seemingly|presumably|supposedly|allegedly|reportedly|notably|remarkably|surprisingly|interestingly|fortunately|unfortunately|luckily|unluckily|happily|sadly|gladly|regretfully|hopefully|fearfully|anxiously|nervously|calmly|peacefully|quietly|loudly|softly|gently|harshly|roughly|smoothly|quickly|slowly|carefully|carelessly|deliberately|accidentally|intentionally|unintentionally|willingly|unwillingly|eagerly|reluctantly|enthusiastically|halfheartedly|wholeheartedly|sincerely|genuinely|honestly|truthfully|falsely|incorrectly|wrongly|rightly|correctly|accurately|precisely|exactly|approximately|roughly|broadly|narrowly|specifically|generally|particularly|especially|notably|remarkably|significantly|considerably|substantially|greatly|immensely|tremendously|enormously|hugely|vastly|extremely|incredibly|amazingly|surprisingly|shockingly|alarmingly|disturbingly|worryingly|concerningly|reassuringly|comfortingly|encouragingly|inspiringly|motivatingly|satisfyingly|pleasingly|delightfully|charmingly|beautifully|elegantly|gracefully|stylishly|fashionably|trendy|modern|contemporary|current|up-to-date|latest|newest|recent|fresh|novel|original|innovative|creative|imaginative|artistic|aesthetic|attractive|appealing|desirable|wanted|needed|required|necessary|essential|important|significant|valuable|useful|helpful|beneficial|advantageous|profitable|worthwhile|meaningful|purposeful|relevant|applicable|suitable|appropriate|fitting|proper|right|correct|accurate|precise|exact|perfect|ideal|optimal|best|excellent|outstanding|exceptional|remarkable|extraordinary|amazing|incredible|fantastic|wonderful|marvelous|superb|magnificent|splendid|brilliant|great|good|fine|okay|alright|decent|acceptable|satisfactory|adequate|sufficient|enough|plenty|abundant|ample|generous|liberal|lavish|luxurious|extravagant|excessive|extreme|radical|drastic|severe|serious|critical|crucial|vital|essential|fundamental|basic|primary|main|principal|chief|major|minor|secondary|tertiary|auxiliary|supplementary|additional|extra|spare|backup|reserve|alternative|substitute|replacement|equivalent|equal|same|identical|similar|comparable|analogous|parallel|corresponding|matching|fitting|suitable|appropriate|proper|right|correct|accurate|true|real|actual|genuine|authentic|original|natural|artificial|synthetic|fake|false|counterfeit|imitation|replica|copy|duplicate|clone|version|model|type|kind|sort|variety|species|breed|strain|stock|line|family|group|class|category|classification|division|section|department|branch|unit|part|component|element|factor|aspect|feature|characteristic|trait|quality|property|attribute|detail|particular|specific|individual|personal|private|public|social|cultural|political|economic|financial|commercial|business|professional|academic|educational|scientific|technical|medical|legal|official|formal|informal|casual|friendly|hostile|neutral|positive|negative|optimistic|pessimistic|realistic|idealistic|practical|theoretical|logical|illogical|rational|irrational|reasonable|unreasonable|sensible|nonsensical|wise|foolish|smart|stupid|intelligent|ignorant|knowledgeable|ignorant|experienced|inexperienced|skilled|unskilled|talented|untalented|gifted|ungifted|capable|incapable|able|unable|competent|incompetent|qualified|unqualified|trained|untrained|educated|uneducated|learned|ignorant|cultured|uncultured|refined|crude|sophisticated|naive|mature|immature|adult|childish|grown-up|youthful|elderly|aged|young|old|new|ancient|modern|contemporary|current|past|present|future|temporary|permanent|short-term|long-term|brief|lengthy|quick|slow|fast|rapid|speedy|swift|immediate|instant|delayed|late|early|punctual|prompt|timely|untimely|seasonal|annual|monthly|weekly|daily|hourly|regular|irregular|frequent|infrequent|constant|variable|steady|unsteady|stable|unstable|reliable|unreliable|dependable|undependable|trustworthy|untrustworthy|honest|dishonest|truthful|deceptive|sincere|insincere|genuine|fake|real|artificial|natural|organic|chemical|biological|physical|mental|emotional|spiritual|psychological|physiological|anatomical|medical|therapeutic|healing|curative|preventive|protective|defensive|offensive|aggressive|passive|active|energetic|lethargic|vigorous|weak|strong|powerful|forceful|gentle|mild|harsh|severe|extreme|moderate|balanced|imbalanced|fair|unfair|just|unjust|equal|unequal|even|uneven|level|tilted|straight|crooked|aligned|misaligned|organized|disorganized|tidy|messy|clean|dirty|pure|impure|fresh|stale|new|old|modern|ancient|updated|outdated|current|obsolete|relevant|irrelevant|important|unimportant|significant|insignificant|major|minor|primary|secondary|main|subordinate|central|peripheral|core|surface|deep|shallow|high|low|tall|short|big|small|large|little|huge|tiny|enormous|minuscule|gigantic|microscopic|massive|lightweight|heavy|light|dense|sparse|thick|thin|wide|narrow|broad|slim|fat|skinny|round|square|circular|rectangular|oval|triangular|curved|straight|bent|twisted|flat|bumpy|smooth|rough|soft|hard|flexible|rigid|elastic|stiff|loose|tight|open|closed|free|restricted|available|unavailable|accessible|inaccessible|public|private|shared|exclusive|common|rare|ordinary|special|normal|abnormal|standard|unique|typical|unusual|regular|irregular|consistent|inconsistent|predictable|unpredictable|stable|unstable|certain|uncertain|definite|indefinite|clear|unclear|obvious|obscure|visible|invisible|apparent|hidden|open|secret|transparent|opaque|bright|dark|light|heavy|colorful|colorless|vivid|dull|sharp|blunt|pointed|rounded|angular|smooth|textured|plain|patterned|solid|hollow|full|empty|complete|incomplete|whole|broken|intact|damaged|perfect|imperfect|flawless|flawed|ideal|realistic|possible|impossible|probable|improbable|likely|unlikely|certain|doubtful|sure|unsure|confident|uncertain|positive|negative|optimistic|pessimistic|hopeful|hopeless|successful|unsuccessful|effective|ineffective|efficient|inefficient|productive|unproductive|useful|useless|helpful|harmful|beneficial|detrimental|advantageous|disadvantageous|profitable|unprofitable|valuable|worthless|expensive|cheap|costly|affordable|pricey|reasonable|excessive|moderate|extreme|mild|severe|gentle|harsh|kind|cruel|friendly|hostile|polite|rude|courteous|discourteous|respectful|disrespectful|considerate|inconsiderate|thoughtful|thoughtless|caring|uncaring|loving|hateful|affectionate|cold|warm|cool|hot|freezing|boiling|comfortable|uncomfortable|pleasant|unpleasant|enjoyable|tedious|interesting|boring|exciting|dull|thrilling|frightening|amusing|serious|funny|sad|happy|joyful|miserable|cheerful|gloomy|bright|dark|lively|lifeless|energetic|tired|active|lazy|busy|idle|productive|wasteful|organized|chaotic|systematic|random|methodical|haphazard|planned|spontaneous|deliberate|accidental|intentional|unintentional|conscious|unconscious|aware|unaware|alert|drowsy|awake|asleep|focused|distracted|concentrated|scattered|attentive|inattentive|observant|oblivious|perceptive|dense|sensitive|insensitive|empathetic|apathetic|understanding|misunderstanding|patient|impatient|tolerant|intolerant|forgiving|unforgiving|merciful|merciless|generous|selfish|giving|taking|sharing|hoarding|open|closed|honest|deceptive|frank|secretive|direct|indirect|straightforward|evasive|clear|vague|specific|general|detailed|brief|comprehensive|limited|extensive|restricted|broad|narrow|wide|tight|loose|free|bound|independent|dependent|autonomous|controlled|self-sufficient|reliant|confident|insecure|bold|timid|brave|cowardly|courageous|fearful|daring|cautious|adventurous|conservative|liberal|progressive|traditional|conventional|unconventional|orthodox|unorthodox|formal|informal|official|unofficial|legal|illegal|legitimate|illegitimate|authorized|unauthorized|approved|disapproved|accepted|rejected|included|excluded|involved|excluded|participating|observing|leading|following|commanding|obeying|directing|receiving|giving|taking|offering|accepting|refusing|agreeing|disagreeing|supporting|opposing|helping|hindering|assisting|obstructing|cooperating|competing|collaborating|conflicting|uniting|dividing|joining|separating|connecting|disconnecting|linking|unlinking|binding|freeing|attaching|detaching|fastening|loosening|securing|releasing|holding|letting|grasping|dropping|catching|missing|finding|losing|discovering|hiding|revealing|concealing|showing|hiding|displaying|covering|exposing|protecting|endangering|saving|wasting|conserving|spending|earning|losing|gaining|winning|failing|succeeding|achieving|missing|reaching|falling|rising|climbing|descending|ascending|going|coming|arriving|departing|entering|exiting|approaching|retreating|advancing|withdrawing|moving|staying|traveling|remaining|visiting|hosting|welcoming|rejecting|inviting|excluding|admitting|denying|allowing|forbidding|permitting|prohibiting|enabling|disabling|empowering|weakening|strengthening|undermining|building|destroying|creating|eliminating|constructing|demolishing|making|breaking|forming|deforming|shaping|reshaping|molding|casting|designing|planning|organizing|arranging|preparing|neglecting|maintaining|repairing|damaging|improving|worsening|upgrading|downgrading|enhancing|reducing|increasing|decreasing|expanding|contracting|growing|shrinking|developing|declining|progressing|regressing|advancing|retreating|evolving|devolving|changing|remaining|transforming|preserving|adapting|resisting|adjusting|maintaining|modifying|altering|keeping|changing|updating|outdating|refreshing|staling|renewing|aging|revitalizing|deteriorating|restoring|destroying|rehabilitating|demolishing|reconstructing|deconstructing|assembling|disassembling|putting|together|taking|apart|combining|separating|mixing|sorting|blending|dividing|merging|splitting|uniting|fragmenting|integrating|segregating|including|excluding|incorporating|omitting|adding|subtracting|inserting|removing|installing|uninstalling|setting|up|taking|down|mounting|dismounting|placing|displacing|positioning|repositioning|locating|relocating|finding|losing|discovering|missing|identifying|misidentifying|recognizing|ignoring|noticing|overlooking|observing|neglecting|watching|ignoring|monitoring|neglecting|tracking|losing|following|leading|guiding|misleading|directing|misdirecting|instructing|confusing|teaching|learning|educating|miseducating|training|mistraining|coaching|miscoaching|mentoring|misguiding|advising|misadvising|counseling|miscounseling|consulting|misleading|informing|misinforming|notifying|failing|to|notify|alerting|missing|warning|failing|to|warn|reminding|forgetting|prompting|neglecting|encouraging|discouraging|motivating|demotivating|inspiring|uninspiring|stimulating|dulling|energizing|draining|revitalizing|exhausting|refreshing|tiring|invigorating|weakening|strengthening|empowering|disempowering|supporting|undermining|helping|hindering|assisting|obstructing|facilitating|impeding|enabling|disabling|allowing|preventing|permitting|prohibiting|authorizing|forbidding|approving|disapproving|accepting|rejecting|welcoming|shunning|embracing|avoiding|including|excluding|inviting|uninviting|attracting|repelling|drawing|pushing|pulling|away|bringing|together|gathering|scattering|collecting|dispersing|assembling|disbanding|organizing|disorganizing|coordinating|uncoordinating|synchronizing|unsynchronizing|harmonizing|clashing|balancing|unbalancing|stabilizing|destabilizing|calming|agitating|soothing|irritating|comforting|disturbing|reassuring|alarming|relaxing|tensing|loosening|tightening|softening|hardening|warming|cooling|heating|chilling|lighting|darkening|brightening|dimming|clarifying|obscuring|revealing|concealing|exposing|covering|uncovering|hiding|showing|displaying|masking|unveiling|demonstrating|proving|disproving|confirming|denying|validating|invalidating|verifying|falsifying|authenticating|counterfeiting|certifying|decertifying|licensing|unlicensing|registering|unregistering|documenting|undocumenting|recording|erasing|logging|deleting|storing|removing|saving|losing|backing|up|restoring|archiving|retrieving|filing|misfiling|cataloging|miscataloging|indexing|misindexing|labeling|mislabeling|tagging|untagging|marking|unmarking|signing|unsigned|stamping|unstamping|sealing|unsealing|locking|unlocking|securing|unsecuring|protecting|exposing|safeguarding|endangering|defending|attacking|guarding|abandoning|watching|neglecting|supervising|unsupervised|overseeing|overlooking|managing|mismanaging|administering|maladministering|governing|misgoverning|ruling|misruling|leading|misleading|commanding|miscommanding|controlling|losing|control|regulating|deregulating|monitoring|unmonitored|supervising|unsupervised|inspecting|uninspected|examining|unexamined|checking|unchecked|testing|untested|evaluating|unevaluated|assessing|unassessed|measuring|unmeasured|gauging|misgauging|estimating|misestimating|calculating|miscalculating|computing|miscomputing|processing|misprocessing|analyzing|misanalyzing|interpreting|misinterpreting|understanding|misunderstanding|comprehending|miscomprehending|grasping|missing|realizing|failing|to|realize|recognizing|failing|to|recognize|acknowledging|ignoring|admitting|denying|confessing|concealing|revealing|hiding|disclosing|withholding|sharing|hoarding|communicating|miscommunicating|expressing|suppressing|articulating|mumbling|speaking|silent|talking|listening|hearing|deaf|seeing|blind|feeling|numb|tasting|tasteless|smelling|odorless|touching|untouchable|sensing|insensible|perceiving|imperceptible|experiencing|inexperienced|living|dead|existing|nonexistent|being|not|being|breathing|suffocating|surviving|perishing|thriving|struggling|flourishing|withering|blooming|wilting|growing|shrinking|developing|declining|maturing|aging|evolving|devolving|progressing|regressing|advancing|retreating|succeeding|failing|winning|losing|achieving|missing|accomplishing|neglecting|completing|abandoning|finishing|starting|ending|beginning|concluding|opening|closing|starting|stopping|continuing|pausing|proceeding|halting|resuming|suspending|maintaining|interrupting|sustaining|breaking|persisting|giving|up|enduring|surrendering|lasting|ending|permanent|temporary|eternal|momentary|forever|never|always|sometimes|constant|variable|continuous|intermittent|regular|irregular|steady|unsteady|consistent|inconsistent|reliable|unreliable|dependable|undependable|stable|unstable|secure|insecure|safe|dangerous|protected|exposed|guarded|unguarded|defended|vulnerable|strong|weak|powerful|powerless|mighty|feeble|robust|frail|sturdy|fragile|solid|brittle|durable|perishable|lasting|temporary|permanent|transient|enduring|fleeting|persistent|brief|long-lasting|short-lived|timeless|dated|current|outdated|modern|ancient|new|old|fresh|stale|recent|distant|near|far|close|remote|immediate|delayed|instant|gradual|quick|slow|fast|sluggish|rapid|leisurely|swift|dawdling|speedy|tardy|prompt|late|early|punctual|timely|untimely|seasonal|perennial|annual|daily|frequent|rare|common|unusual|ordinary|extraordinary|normal|abnormal|regular|irregular|standard|nonstandard|typical|atypical|usual|unusual|conventional|unconventional|traditional|innovative|classic|modern|vintage|contemporary|retro|futuristic|timeless|trendy|outdated|fashionable|unfashionable|stylish|unstylish|elegant|inelegant|graceful|clumsy|beautiful|ugly|attractive|unattractive|appealing|unappealing|charming|repulsive|lovely|hideous|pretty|plain|gorgeous|homely|handsome|unsightly|stunning|dull|striking|bland|impressive|unimpressive|remarkable|unremarkable|notable|insignificant|outstanding|mediocre|exceptional|ordinary|extraordinary|common|amazing|boring|incredible|believable|fantastic|realistic|wonderful|terrible|marvelous|awful|superb|poor|excellent|bad|great|terrible|good|evil|fine|coarse|perfect|flawed|ideal|realistic|flawless|defective|pristine|damaged|mint|worn|new|used|fresh|stale|clean|dirty|pure|contaminated|clear|murky|transparent|opaque|visible|invisible|obvious|hidden|apparent|concealed|evident|obscure|manifest|latent|explicit|implicit|direct|indirect|straight|crooked|honest|dishonest|truthful|deceptive|sincere|fake|genuine|artificial|real|imaginary|actual|fictitious|factual|false|true|correct|incorrect|right|wrong|accurate|inaccurate|precise|imprecise|exact|approximate|specific|general|detailed|vague|particular|broad|narrow|wide|limited|unlimited|restricted|free|bounded|infinite|finite|endless|complete|incomplete|whole|partial|total|fractional|full|empty|solid|hollow|dense|sparse|thick|thin|heavy|light|weighty|weightless|massive|tiny|huge|small|large|little|big|small|giant|miniature|enormous|minuscule|colossal|microscopic|immense|negligible|vast|limited|extensive|minimal|comprehensive|superficial|thorough|cursory|deep|shallow|profound|trivial|significant|insignificant|important|unimportant|major|minor|primary|secondary|main|auxiliary|principal|subordinate|chief|assistant|leading|following|first|last|initial|final|beginning|ending|starting|concluding|opening|closing|introductory|concluding|preliminary|conclusive|early|late|advanced|basic|elementary|sophisticated|simple|complex|easy|difficult|effortless|challenging|smooth|rough|gentle|harsh|soft|hard|tender|tough|delicate|sturdy|fragile|strong|weak|powerful|feeble|mighty|frail|robust|brittle|flexible|rigid|elastic|stiff|loose|tight|relaxed|tense|calm|agitated|peaceful|turbulent|quiet|noisy|silent|loud|soft|hard|gentle|violent|mild|severe|light|heavy|bright|dark|cheerful|gloomy|happy|sad|joyful|sorrowful|glad|unhappy|pleased|displeased|satisfied|dissatisfied|content|discontent|comfortable|uncomfortable|cozy|uncomfortable|warm|cold|hot|cool|freezing|burning|pleasant|unpleasant|enjoyable|tedious|delightful|dreadful|amusing|boring|entertaining|dull|exciting|monotonous|thrilling|tiresome|stimulating|unstimulating|interesting|uninteresting|engaging|disengaging|captivating|repelling|fascinating|mundane|intriguing|obvious|mysterious|clear|puzzling|understandable|confusing|comprehensible|incomprehensible|logical|illogical|rational|irrational|reasonable|unreasonable|sensible|nonsensical|practical|impractical|realistic|unrealistic|possible|impossible|feasible|unfeasible|achievable|unachievable|attainable|unattainable|reachable|unreachable|accessible|inaccessible|available|unavailable|obtainable|unobtainable|acquirable|unacquirable|doable|undoable|workable|unworkable|viable|unviable|sustainable|unsustainable|maintainable|unmaintainable|manageable|unmanageable|controllable|uncontrollable|governable|ungovernable|handleable|unhandleable|solvable|unsolvable|resolvable|irresolvable|answerable|unanswerable|explainable|unexplainable|understandable|incomprehensible|interpretable|uninterpretable|readable|unreadable|clear|unclear|legible|illegible|visible|invisible|audible|inaudible|hearable|unhearable|perceptible|imperceptible|detectable|undetectable|noticeable|unnoticeable|observable|unobservable|recognizable|unrecognizable|identifiable|unidentifiable|distinguishable|indistinguishable|discernible|indiscernible|apparent|unapparent|evident|unevident|obvious|unobvious|manifest|unmanifest|patent|latent|explicit|implicit|overt|covert|open|closed|public|private|revealed|concealed|disclosed|undisclosed|exposed|hidden|shown|unshown|displayed|undisplayed|exhibited|unexposed|presented|unpresented|demonstrated|undemonstrated|illustrated|unillustrated|exemplified|unexemplified|proven|unproven|confirmed|unconfirmed|verified|unverified|validated|invalidated|authenticated|unauthenticated|certified|uncertified|approved|unapproved|accepted|rejected|endorsed|opposed|supported|unsupported|backed|unbacked|sponsored|unsponsored|funded|unfunded|financed|unfinanced|subsidized|unsubsidized|granted|denied|awarded|refused|given|withheld|provided|unprovided|supplied|unsupplied|furnished|unfurnished|equipped|unequipped|armed|unarmed|prepared|unprepared|ready|unready|set|unset|arranged|unarranged|organized|disorganized|planned|unplanned|scheduled|unscheduled|programmed|unprogrammed|designed|undesigned|intended|unintended|purposed|accidental|deliberate|unintentional|conscious|unconscious|aware|unaware|knowing|unknowing|informed|uninformed|educated|uneducated|taught|untaught|trained|untrained|instructed|uninstructed|guided|unguided|directed|undirected|led|misled|supervised|unsupervised|monitored|unmonitored|watched|unwatched|observed|unobserved|noticed|unnoticed|seen|unseen|viewed|unviewed|looked|overlooked|examined|unexamined|inspected|uninspected|studied|unstudied|researched|unresearched|investigated|uninvestigated|explored|unexplored|discovered|undiscovered|found|lost|located|misplaced|positioned|displaced|placed|misplaced|set|unset|put|removed|installed|uninstalled|mounted|unmounted|attached|detached|connected|disconnected|linked|unlinked|joined|separated|united|divided|combined|split|merged|parted|integrated|segregated|included|excluded|incorporated|omitted|added|subtracted|inserted|extracted|introduced|withdrawn|brought|taken|carried|left|transported|abandoned|moved|stayed|shifted|remained|transferred|kept|delivered|withheld|sent|received|given|taken|offered|refused|provided|denied|supplied|withheld|furnished|stripped|equipped|unequipped|loaded|unloaded|filled|emptied|packed|unpacked|wrapped|unwrapped|covered|uncovered|dressed|undressed|clothed|naked|adorned|plain|decorated|undecorated|ornamented|simple|embellished|stark|beautified|uglified|enhanced|degraded|improved|worsened|upgraded|downgraded|advanced|retreated|developed|declined|progressed|regressed|evolved|devolved|grown|shrunk|increased|decreased|expanded|contracted|enlarged|reduced|extended|shortened|lengthened|truncated|broadened|narrowed|widened|tightened|deepened|shallowed|heightened|lowered|raised|dropped|lifted|fell|rose|climbed|descended|ascended|went|came|arrived|departed|entered|exited|approached|retreated|advanced|withdrew|moved|stopped|started|began|ended|finished|completed|abandoned|continued|paused|resumed|proceeded|halted|persisted|quit|maintained|interrupted|sustained|broke|kept|lost|held|released|grasped|dropped|caught|missed|found|lost|discovered|hid|revealed|concealed|showed|displayed|exhibited|presented|demonstrated|proved|disproved|confirmed|denied|validated|invalidated|verified|falsified)\b/i.test(message);

    const systemPrompt = `You are an intelligent shopping assistant for ExCom, an e-commerce platform. Your primary role is to help users find and recommend products from our catalog.

    **IMPORTANT INSTRUCTIONS:**
    1. When users mention ANY product name or type (even just "camera", "laptop", "phone", etc.), immediately search our product catalog and recommend specific products
    2. Always prioritize showing actual products from our ExCom catalog over generic advice
    3. Be direct and helpful - users want product recommendations, not lengthy explanations
    4. If you find matching products, format your response to highlight them clearly

    **CURRENT EXCOM PRODUCT CATALOG:**
    ${JSON.stringify(productCatalog, null, 2)}

    **USER CONTEXT:**
    ${JSON.stringify(context || {}, null, 2)}

    **RESPONSE STRATEGY:**
    ${isProductQuery ? 
      `🎯 PRODUCT QUERY DETECTED: The user is looking for products. Search the catalog for matches and recommend specific items with prices and descriptions.` :
      `💬 GENERAL CHAT: Provide helpful shopping assistance and guide users to find products they need.`
    }

    **RESPONSE GUIDELINES:**
    - Start with a brief, friendly greeting
    - If product query: Show 2-4 matching products with details (name, price, brief description)
    - Include product IDs for easy reference
    - Keep responses conversational but focused
    - Always end by asking if they need more specific recommendations

    Remember: Users want quick, helpful product recommendations from ExCom's actual inventory!`;

    const result = await model.generateContent([
      systemPrompt,
      `User message: "${message}"`
    ]);
    
    const response = await result.response;
    const aiResponse = response.text();
    
    // If this looks like a product query, try to extract product recommendations
    if (isProductQuery) {
      console.log('AI Chat: Product query detected, analyzing for product matches...');
      
      // Search for products that match the user's query
      const searchTerms = message.toLowerCase();
      const matchingProducts = allProducts.filter(product => {
        const searchableText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        return searchTerms.split(' ').some(term => 
          searchableText.includes(term) && term.length > 2
        );
      }).slice(0, 4); // Limit to 4 products
      
      if (matchingProducts.length > 0) {
        console.log(`AI Chat: Found ${matchingProducts.length} matching products`);
        
        // Enhanced response with actual products
        const productsText = matchingProducts.map(p => 
          `📦 **${p.title}** - $${p.price}\n   ${p.description.substring(0, 100)}...\n   Category: ${p.category} | ID: ${p._id}`
        ).join('\n\n');
        
        const enhancedResponse = `${aiResponse}

🛍️ **Here are some products from ExCom that match your search:**

${productsText}

Would you like more details about any of these products, or shall I help you find something else?`;

        return enhancedResponse;
      }
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Gemini chat error:', error);
    return "I'm sorry, I'm having trouble processing your request right now. But I'm here to help you find products on ExCom! Try telling me what you're looking for, like 'camera' or 'laptop', and I'll show you our available options.";
  }
}

export async function geminiSmartSearch(query: string, userId?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Get ALL products available (no limit to see everything)
    const products = await Product.find().populate('seller', 'name rating').sort({ createdAt: -1 });
    
    console.log(`AI Search: Found ${products.length} products to analyze for query: "${query}"`);
    
    // Get comprehensive user context if available
    let userContext = '';
    let userPreferences = {
      categories: [] as string[],
      priceRange: { min: 0, max: 10000 },
      brands: [] as string[]
    };
    
    if (userId) {
      try {
        const user = await User.findById(userId);
        const recentOrders = await Order.find({ buyer: userId })
          .populate('items.product', 'title category price seller')
          .limit(10)
          .sort({ createdAt: -1 });
        
        // Analyze user's purchase patterns
        const purchasedItems = recentOrders.flatMap(order => order.items);
        userPreferences.categories = [...new Set(purchasedItems.map(item => item.product.category))];
        
        const prices = purchasedItems.map(item => item.product.price);
        if (prices.length > 0) {
          userPreferences.priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices)
          };
        }
        
        userPreferences.brands = [...new Set(purchasedItems.map(item => item.product.seller?.name).filter(Boolean))];
        
        userContext = `User Profile: ${user?.name || 'Anonymous'}
        Purchase History: ${purchasedItems.length} items bought
        Preferred Categories: ${userPreferences.categories.join(', ') || 'No history'}
        Price Range Preference: $${userPreferences.priceRange.min} - $${userPreferences.priceRange.max}
        Favorite Brands: ${userPreferences.brands.join(', ') || 'No brand preference'}
        Recent Purchases: ${purchasedItems.slice(0, 5).map(item => 
          `${item.product.title} ($${item.product.price}) - ${item.product.category}`
        ).join('; ')}`;
      } catch (error) {
        console.error('Error getting user context:', error);
        userContext = 'User: Anonymous (no purchase history available)';
      }
    }

    // Create comprehensive product context with more details
    const productContext = products.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      seller: p.seller?.name || 'Unknown',
      keywords: `${p.title} ${p.description} ${p.category}`.toLowerCase(),
      // Add derived attributes for better matching
      priceCategory: p.price < 50 ? 'budget' : p.price < 200 ? 'mid-range' : 'premium'
    }));

    const searchPrompt = `You are an advanced AI shopping assistant with deep product knowledge. Your goal is to understand the user's search intent and find the most relevant products from our complete inventory.

    USER SEARCH QUERY: "${query}"

    USER PROFILE:
    ${userContext}

    COMPLETE PRODUCT INVENTORY (${products.length} products):
    ${JSON.stringify(productContext, null, 2)}

    ANALYSIS INSTRUCTIONS:
    1. UNDERSTAND USER INTENT:
       - Parse the query for product type, features, budget hints, use case
       - Consider synonyms and related terms (e.g., "laptop" includes "notebook", "computer")
       - Identify emotional cues (e.g., "best", "cheap", "premium", "reliable")

    2. SMART MATCHING ALGORITHM:
       - Primary: Direct keyword matches in title/description
       - Secondary: Semantic similarity (e.g., "phone" matches "smartphone", "mobile")
       - Tertiary: Category and use-case matching
       - Consider user's purchase history for personalization
       - Factor in price preferences from user history

    3. RANKING CRITERIA:
       - Relevance to search query (40%)
       - User preference alignment (30%)
       - Price-value ratio (20%)
       - Product popularity indicators (10%)

    4. PROVIDE INTELLIGENT SUGGESTIONS:
       - Alternative search terms
       - Related categories to explore
       - Price range recommendations
       - Feature-based refinements

    RESPONSE FORMAT (valid JSON only):
    {
      "intent": "Clear description of what the user is looking for",
      "recommendations": [
        {
          "productId": "exact_product_id_from_inventory",
          "relevanceScore": 0.95,
          "reason": "Detailed explanation of why this product matches (mention specific features, price fit, etc.)"
        }
      ],
      "suggestions": ["refined search terms", "alternative keywords", "related products"],
      "priceRange": { 
        "min": estimated_minimum_price, 
        "max": estimated_maximum_price,
        "recommended": "suggested price range based on query"
      },
      "categories": ["most relevant categories for this search"],
      "searchTips": ["helpful tips for finding better products"]
    }

    IMPORTANT: 
    - Return 8-12 most relevant products maximum
    - Ensure all productIds exist in the provided inventory
    - Relevance scores should be realistic (0.7-0.98 range)
    - Consider user's budget preferences if available
    - Include both exact matches and semantically similar products`;

    const result = await model.generateContent(searchPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('AI Search Response:', responseText.substring(0, 500) + '...');
    
    try {
      // Clean the response text to ensure it's valid JSON
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResult = JSON.parse(cleanedResponse);
      
      // Validate that all recommended products exist
      const validRecommendations = parsedResult.recommendations.filter((rec: any) => 
        products.some(p => p._id.toString() === rec.productId)
      );
      
      console.log(`AI Search: Generated ${validRecommendations.length} valid recommendations`);
      
      return {
        ...parsedResult,
        recommendations: validRecommendations,
        totalProductsSearched: products.length
      };
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw response:', responseText);
      
      // Enhanced fallback with basic keyword matching
      const fallbackResults = products.filter(p => {
        const searchTerms = query.toLowerCase().split(' ');
        const productText = `${p.title} ${p.description} ${p.category}`.toLowerCase();
        return searchTerms.some(term => productText.includes(term));
      }).slice(0, 8).map(p => ({
        productId: p._id.toString(),
        relevanceScore: 0.7,
        reason: `Product matches your search for "${query}"`
      }));
      
      return {
        intent: `Search for products related to "${query}"`,
        recommendations: fallbackResults,
        suggestions: [query, ...query.split(' ')],
        priceRange: { min: 0, max: 1000, recommended: "Based on available products" },
        categories: [...new Set(products.slice(0, 20).map(p => p.category))],
        searchTips: ["Try more specific keywords", "Include brand names", "Specify your budget"],
        totalProductsSearched: products.length,
        fallbackUsed: true
      };
    }
  } catch (error) {
    console.error('Gemini smart search error:', error);
    
    // Ultimate fallback - return some products
    const fallbackProducts = await Product.find().limit(6);
    
    return {
      intent: "Product search",
      recommendations: fallbackProducts.map(p => ({
        productId: p._id.toString(),
        relevanceScore: 0.5,
        reason: "Recommended product from our catalog"
      })),
      suggestions: [query],
      priceRange: { min: 0, max: 1000, recommended: "All price ranges" },
      categories: ["Electronics", "Fashion", "Home"],
      searchTips: ["Check your internet connection", "Try simpler search terms"],
      totalProductsSearched: 0,
      error: "AI search temporarily unavailable"
    };
  }
}

export async function geminiRecommend(userId?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Get ALL available products to provide best recommendations
    const allProducts = await Product.find().populate('seller', 'name rating').sort({ createdAt: -1 });
    console.log(`AI Recommend: Analyzing ${allProducts.length} products for recommendations`);
    
    // Get comprehensive user context and behavioral analysis
    let userContext = '';
    let userProfile = {
      categories: [] as string[],
      avgPrice: 0,
      totalSpent: 0,
      preferredBrands: [] as string[],
      recentActivity: [] as any[]
    };
    
    if (userId) {
      try {
        const user = await User.findById(userId);
        const recentOrders = await Order.find({ buyer: userId })
          .populate('items.product', 'title category price description seller')
          .limit(20)
          .sort({ createdAt: -1 });
        
        // Deep user behavior analysis
        const purchasedItems = recentOrders.flatMap(order => order.items);
        
        if (purchasedItems.length > 0) {
          userProfile.categories = [...new Set(purchasedItems.map(item => item.product.category))];
          const prices = purchasedItems.map(item => item.product.price);
          userProfile.avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          userProfile.totalSpent = prices.reduce((sum, price) => sum + price, 0);
          userProfile.preferredBrands = [...new Set(purchasedItems.map(item => item.product.seller?.name).filter(Boolean))];
          userProfile.recentActivity = purchasedItems.slice(0, 10).map(item => ({
            title: item.product.title,
            category: item.product.category,
            price: item.product.price,
            description: item.product.description.substring(0, 100)
          }));
        }
        
        userContext = `USER PROFILE ANALYSIS:
        Name: ${user?.name || 'Anonymous'}
        Purchase History: ${purchasedItems.length} items purchased
        Total Spending: $${userProfile.totalSpent.toFixed(2)}
        Average Purchase Price: $${userProfile.avgPrice.toFixed(2)}
        Favorite Categories: ${userProfile.categories.join(', ') || 'No specific preference'}
        Preferred Brands: ${userProfile.preferredBrands.join(', ') || 'No brand loyalty shown'}
        Shopping Behavior: ${userProfile.avgPrice < 50 ? 'Budget-conscious' : userProfile.avgPrice < 200 ? 'Mid-range shopper' : 'Premium buyer'}
        
        RECENT PURCHASES:
        ${userProfile.recentActivity.map(item => 
          `- ${item.title} (${item.category}) - $${item.price} - ${item.description}`
        ).join('\n')}`;
      } catch (error) {
        console.error('Error analyzing user profile:', error);
        userContext = 'NEW USER: No purchase history available - provide diverse recommendations across categories';
      }
    } else {
      userContext = 'ANONYMOUS USER: Provide trending and popular products across different categories and price ranges';
    }

    // Create comprehensive product catalog
    const productCatalog = allProducts.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      seller: p.seller?.name || 'Unknown',
      priceRange: p.price < 50 ? 'budget' : p.price < 200 ? 'mid-range' : 'premium',
      keywords: `${p.title} ${p.description} ${p.category} ${p.seller?.name || ''}`.toLowerCase()
    }));

    const recommendPrompt = `You are an advanced AI recommendation engine with deep learning capabilities. Analyze user behavior and product catalog to generate highly personalized product recommendations.

    ${userContext}

    COMPLETE PRODUCT CATALOG (${allProducts.length} products):
    ${JSON.stringify(productCatalog, null, 2)}

    RECOMMENDATION STRATEGY:
    1. PERSONALIZATION ANALYSIS:
       - Match user's purchase patterns and preferences
       - Consider price sensitivity and spending behavior
       - Factor in category preferences and brand loyalty
       - Identify complementary products (cross-selling opportunities)
       - Suggest upgrade paths for owned items

    2. RECOMMENDATION ALGORITHMS:
       - Collaborative filtering (users with similar purchases)
       - Content-based filtering (product features and attributes)
       - Trend analysis (popular and emerging products)
       - Seasonal and contextual relevance
       - Value optimization (price-quality ratio)

    3. DIVERSIFICATION STRATEGY:
       - Mix of familiar categories and new discoveries
       - Range of price points appropriate for user
       - Balance between popular and niche products
       - Include both immediate needs and aspirational items

    4. QUALITY ASSURANCE:
       - Ensure all recommended products exist in catalog
       - Provide detailed reasoning for each recommendation
       - Score recommendations based on multiple factors
       - Avoid recommending recently purchased items

    RESPONSE FORMAT (valid JSON only):
    {
      "recommendations": [
        {
          "productId": "exact_product_id_from_catalog",
          "score": 0.95,
          "reason": "Detailed explanation why this product is recommended (consider user history, needs, preferences)",
          "category": "product_category",
          "recommendationType": "trending|similar|complementary|upgrade|discovery",
          "confidenceLevel": "high|medium|low"
        }
      ],
      "insights": {
        "userType": "description of user shopping behavior",
        "recommendationStrategy": "explanation of approach used",
        "diversificationNote": "how recommendations are balanced"
      }
    }

    REQUIREMENTS:
    - Return 8-12 high-quality recommendations
    - Ensure variety across categories and price ranges
    - Provide specific, actionable reasons for each recommendation
    - Score based on relevance, user fit, and product quality
    - All product IDs must exist in the provided catalog`;

    const result = await model.generateContent(recommendPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('AI Recommendations Response:', responseText.substring(0, 300) + '...');
    
    try {
      // Clean and parse the response
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate and fetch actual product data
      const validRecommendations = parsed.recommendations.filter((rec: any) => 
        allProducts.some(p => p._id.toString() === rec.productId)
      );
      
      const recommendedProducts = await Promise.all(
        validRecommendations.map(async (rec: any) => {
          const product = await Product.findById(rec.productId).populate('seller', 'name');
          if (product) {
            return {
              ...product.toObject(),
              recommendationReason: rec.reason,
              recommendationScore: rec.score,
              recommendationType: rec.recommendationType,
              confidenceLevel: rec.confidenceLevel
            };
          }
          return null;
        })
      );

      const filteredRecommendations = recommendedProducts.filter(Boolean);
      console.log(`AI Recommend: Generated ${filteredRecommendations.length} valid recommendations`);
      
      return filteredRecommendations;
      
    } catch (parseError) {
      console.error('JSON parsing error in recommendations:', parseError);
      console.log('Raw recommendations response:', responseText);
      
      // Enhanced fallback with user-aware selection
      let fallbackProducts;
      
      if (userProfile.categories.length > 0) {
        // User has history - recommend from preferred categories
        fallbackProducts = allProducts.filter(p => 
          userProfile.categories.includes(p.category) || 
          Math.abs(p.price - userProfile.avgPrice) < userProfile.avgPrice * 0.5
        ).slice(0, 8);
      } else {
        // New user - recommend popular/recent products
        fallbackProducts = allProducts.slice(0, 8);
      }
      
      return fallbackProducts.map(p => ({
        ...p.toObject(),
        recommendationReason: userProfile.categories.length > 0 
          ? `Recommended based on your interest in ${userProfile.categories[0]} and similar price range`
          : 'Popular trending product',
        recommendationScore: 0.75,
        recommendationType: 'trending',
        confidenceLevel: 'medium'
      }));
    }
  } catch (error) {
    console.error('Gemini recommend error:', error);
    
    // Ultimate fallback
    const fallbackProducts = await Product.find().limit(8);
    return fallbackProducts.map(p => ({
      ...p.toObject(),
      recommendationReason: 'Featured product from our catalog',
      recommendationScore: 0.6,
      recommendationType: 'trending',
      confidenceLevel: 'low'
    }));
  }
}

export async function geminiCompareProducts(productIds: string[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Fetch products to compare
    const products = await Product.find({ _id: { $in: productIds } }).populate('seller', 'name');
    
    if (products.length < 2) {
      return { error: 'Need at least 2 products to compare' };
    }

    const productData = products.map(p => ({
      id: p._id,
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      seller: p.seller?.name
    }));

    const comparePrompt = `You are a product comparison expert. Compare these products objectively and help users make informed decisions.

    Products to compare:
    ${JSON.stringify(productData, null, 2)}

    Your task:
    1. Compare key features and specifications
    2. Analyze price-to-value ratio
    3. Identify pros and cons for each product
    4. Provide a recommendation based on different use cases
    5. Highlight unique selling points

    Response format:
    {
      "comparison": {
        "products": [
          {
            "productId": "id",
            "pros": ["advantage 1", "advantage 2"],
            "cons": ["disadvantage 1"],
            "bestFor": "type of user or use case",
            "valueScore": 8.5
          }
        ],
        "winner": {
          "overall": "product_id",
          "bestValue": "product_id", 
          "bestQuality": "product_id"
        },
        "summary": "comparison summary and recommendation"
      }
    }`;

    const result = await model.generateContent(comparePrompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (parseError) {
      // Fallback comparison
      return {
        comparison: {
          products: productData.map(p => ({
            productId: p.id,
            pros: ['Available for purchase'],
            cons: ['Limited information'],
            bestFor: 'General use',
            valueScore: 7.0
          })),
          winner: {
            overall: productData[0].id,
            bestValue: productData[0].id,
            bestQuality: productData[0].id
          },
          summary: `Comparison of ${productData.length} products. All products are available for purchase.`
        }
      };
    }
  } catch (error) {
    console.error('Gemini compare error:', error);
    return { error: 'Unable to compare products at this time' };
  }
}

export async function geminiGenerateListing({ imageBase64, text }: { imageBase64?: string; text?: string; }) {
  try {
    const model = imageBase64 
      ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      : genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a professional product listing based on the provided information.

    ${text ? `Description: ${text}` : ''}

    Create:
    1. Compelling product title (max 60 characters)
    2. Detailed description (2-3 paragraphs)
    3. Key features/benefits (bullet points)
    4. Suggested categories and tags
    5. Estimated price range

    Response format:
    {
      "title": "Product Title",
      "description": "Detailed product description...",
      "features": ["feature 1", "feature 2", "feature 3"],
      "category": "suggested category",
      "tags": ["tag1", "tag2", "tag3"],
      "priceRange": { "min": 10, "max": 100 }
    }`;

    let result;
    if (imageBase64) {
      const image = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      };
      result = await model.generateContent([prompt, image]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (parseError) {
      return {
        title: 'AI Generated Product',
        description: 'AI generated description based on your input.',
        features: ['AI generated listing'],
        category: 'General',
        tags: ['ai', 'autogen', 'listing'],
        priceRange: { min: 10, max: 100 }
      };
    }
  } catch (error) {
    console.error('Gemini generate listing error:', error);
    return {
      title: 'New Product Listing',
      description: 'Please provide more details about this product.',
      features: ['New product'],
      category: 'General',
      tags: ['new', 'product'],
      priceRange: { min: 10, max: 100 }
    };
  }
}