// exercises.js
export const EXERCISES = [
  // --- HIPS & GLUTES ---
  {
    id: 'hip-flexor-stretch',
    name: 'Hip Flexor Stretch',
    targetArea: 'hips',
    description: 'Lengthens the hip flexors that shorten and tighten from prolonged sitting.',
    cues: [
      'Lower into a lunge with your back knee on the floor',
      'Drive your hips forward — not your chest',
      'Keep your core braced and hold the tension without bouncing'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'hip-flexor-stretch.svg'
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    targetArea: 'hips',
    description: 'Reactivates the glutes, which become inhibited and weak from sitting all day.',
    cues: [
      'Lie on your back, feet flat, knees bent to 90 degrees',
      'Press through your heels to drive your hips toward the ceiling',
      'Squeeze your glutes hard at the top and hold for 2 seconds before lowering'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'glute-bridge.svg'
  },
  {
    id: 'figure-four-stretch',
    name: 'Standing Figure-Four',
    targetArea: 'hips',
    description: 'Opens the hip external rotators and stretches the piriformis, which compresses under prolonged sitting.',
    cues: [
      'Stand on one foot, cross the opposite ankle over your standing knee',
      'Sit back as if lowering into a chair and keep your chest up',
      'Use a wall for balance if needed; feel the stretch in the crossed leg hip'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'figure-four-stretch.svg'
  },
  {
    id: 'lateral-hip-circles',
    name: 'Lateral Hip Circles',
    targetArea: 'hips',
    description: 'Restores hip mobility through its full range of motion in all planes.',
    cues: [
      'Stand with feet shoulder-width apart and hands on your hips',
      'Draw slow, large circles with your hips in full rotation both directions',
      'Keep your shoulders still; the movement comes entirely from the hips'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'lateral-hip-circles.svg'
  },
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    targetArea: 'hips',
    description: 'Activates the calf muscle pump to push pooled blood back up from the lower legs.',
    cues: [
      'Stand with feet hip-width apart, holding a wall or desk for light balance',
      'Rise onto the balls of your feet as high as you can go',
      'Lower slowly, taking 3 seconds on the way down to maximize the pumping effect'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'calf-raises.svg'
  },

  // --- SPINE & CORE ---
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    targetArea: 'spine',
    description: 'Pumps synovial fluid through the spinal joints and counteracts the static compression of sitting.',
    cues: [
      'On hands and knees, align wrists under shoulders and knees under hips',
      'Inhale to arch (cow): lift your chest and tailbone toward the ceiling',
      'Exhale to round (cat): tuck your chin and tailbone, push the floor away'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'cat-cow.svg'
  },
  {
    id: 'thoracic-rotation',
    name: 'Thoracic Rotation',
    targetArea: 'spine',
    description: 'Restores mid-back rotation that is lost when you are locked in a forward-facing desk position.',
    cues: [
      'Sit on the edge of your chair, feet flat, hands behind your head',
      'Rotate your upper back to one side and lead with your elbow, not your shoulder',
      'Keep your hips square; the rotation happens at the mid-back, not the lower back'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'thoracic-rotation.svg'
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    targetArea: 'spine',
    description: 'Trains deep core stability to support the lumbar spine against the load of sitting.',
    cues: [
      'Lie on your back, arms pointing at the ceiling, knees bent at 90 degrees in the air',
      'Slowly lower one arm and the opposite leg toward the floor without letting your back arch',
      'Return to start and switch sides; breathe out on each extension'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'dead-bug.svg'
  },
  {
    id: 'standing-backbend',
    name: 'Standing Backbend',
    targetArea: 'spine',
    description: 'Decompresses the lumbar spine and counteracts the forward flexion posture of desk work.',
    cues: [
      'Stand tall, place your hands on your lower back with fingers pointing down',
      'Gently arch backward, looking up toward the ceiling without straining',
      'Hold 2 to 3 seconds and return to upright; this is a gentle extension, not a full backbend'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'standing-backbend.svg'
  },
  {
    id: 'seated-spinal-twist',
    name: 'Seated Spinal Twist',
    targetArea: 'spine',
    description: 'Restores rotational mobility to the lumbar and thoracic spine without leaving your chair.',
    cues: [
      'Sit tall at the front of your chair, feet flat on the floor',
      'Place your right hand on your left knee, left hand on the back of the chair',
      'Rotate through your entire spine on the exhale and hold 20 to 30 seconds, then switch sides'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'seated-spinal-twist.svg'
  },

  // --- SHOULDERS & CHEST ---
  {
    id: 'doorway-chest-opener',
    name: 'Doorway Chest Opener',
    targetArea: 'shoulders',
    description: 'Stretches the pectoral muscles that shorten and pull the shoulders forward at a desk.',
    cues: [
      'Stand in a doorway, place forearms on the frame at 90 degrees',
      'Step one foot through and gently lean forward until you feel a stretch across the chest',
      'Keep your chin tucked and do not let your head jut forward during the stretch'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'doorway-chest-opener.svg'
  },
  {
    id: 'shoulder-blade-squeeze',
    name: 'Shoulder Blade Squeeze',
    targetArea: 'shoulders',
    description: 'Activates the mid-trapezius and rhomboids, which become inhibited in the rounded-shoulder desk posture.',
    cues: [
      'Sit or stand tall, arms at your sides',
      'Squeeze your shoulder blades together and down, imagining tucking them into your back pockets',
      'Hold for 5 seconds, release fully, and repeat; do not shrug your shoulders upward'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'shoulder-blade-squeeze.svg'
  },
  {
    id: 'cross-body-shoulder-stretch',
    name: 'Cross-Body Shoulder Stretch',
    targetArea: 'shoulders',
    description: 'Releases the posterior shoulder capsule that tightens from sustained keyboard and mouse use.',
    cues: [
      'Bring one arm straight across your chest at shoulder height',
      'Use your opposite hand or forearm to gently press it toward your chest',
      'Keep your shoulder down and resist letting it creep up toward your ear'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'cross-body-shoulder-stretch.svg'
  },
  {
    id: 'overhead-reach',
    name: 'Overhead Reach',
    targetArea: 'shoulders',
    description: 'Restores full shoulder elevation and decompresses the thoracic spine simultaneously.',
    cues: [
      'Interlace your fingers and press your palms toward the ceiling',
      'Reach as high as you can, lengthening through your entire side body',
      'Take a deep breath in at the top and let your rib cage expand fully'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'overhead-reach.svg'
  },
  {
    id: 'wall-angels',
    name: 'Wall Angels',
    targetArea: 'shoulders',
    description: 'Trains the shoulder blades to move correctly and restores thoracic extension against gravity.',
    cues: [
      'Stand with your back flat against a wall, feet 6 inches out, low back gently pressed in',
      'Press the backs of your hands and forearms to the wall at 90 degrees',
      'Slowly slide your arms up and overhead and keep the entire arm in contact with the wall'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wall-angels.svg'
  },

  // --- NECK & UPPER TRAPS ---
  {
    id: 'chin-tucks',
    name: 'Chin Tucks',
    targetArea: 'neck',
    description: 'Corrects forward head posture (tech neck) by retraining the deep cervical flexors.',
    cues: [
      'Sit or stand tall, eyes forward',
      'Gently draw your chin straight back as if making a double chin',
      'Hold 5 seconds; you should feel a light stretch at the base of the skull, not pain'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'chin-tucks.svg'
  },
  {
    id: 'lateral-neck-stretch',
    name: 'Lateral Neck Stretch',
    targetArea: 'neck',
    description: 'Releases the upper trapezius and scalene muscles that become chronically tight from screen tension.',
    cues: [
      'Sit tall, reach one hand under your thigh or hold the seat to anchor the shoulder down',
      'Tilt your ear toward the opposite shoulder and let gravity do the work',
      'Hold 20 to 30 seconds each side; do not force it further with your hand'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'lateral-neck-stretch.svg'
  },
  {
    id: 'levator-scapulae-stretch',
    name: 'Levator Scapulae Stretch',
    targetArea: 'neck',
    description: 'Targets the muscle running from the neck to the shoulder blade, a common source of desk-related neck pain.',
    cues: [
      'Sit tall, rotate your head 45 degrees to one side',
      'Tilt your chin down toward your armpit on that same side',
      'Use your hand on top of your head to add gentle weight and never force the stretch'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'levator-scapulae-stretch.svg'
  },
  {
    id: 'neck-rolls',
    name: 'Neck Rolls',
    targetArea: 'neck',
    description: 'Improves cervical mobility and releases accumulated tension from sustained screen time.',
    cues: [
      'Drop your chin to your chest and slowly roll your head to one shoulder',
      'Continue around in a full half-circle to the other shoulder; do not roll the head back',
      'Move slowly with your eyes closed and stop to breathe into any point of tension'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'neck-rolls.svg'
  },

  // --- WRISTS & FOREARMS ---
  {
    id: 'wrist-flexor-stretch',
    name: 'Wrist Flexor Stretch',
    targetArea: 'wrists',
    description: 'Lengthens the forearm flexors that tighten from hours of typing and mouse use.',
    cues: [
      'Extend one arm forward, palm up',
      'With your other hand, gently press the fingers back toward your body',
      'Hold 20 to 30 seconds; you should feel the stretch along the inner forearm'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wrist-flexor-stretch.svg'
  },
  {
    id: 'wrist-extensor-stretch',
    name: 'Wrist Extensor Stretch',
    targetArea: 'wrists',
    description: 'Releases the forearm extensors, which are often overlooked but contribute to lateral elbow pain.',
    cues: [
      'Extend one arm forward, palm down, fingers pointing toward the floor',
      'With your other hand, gently press the back of your hand toward your body',
      'Hold 20 to 30 seconds; you should feel the stretch along the top of the forearm'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wrist-extensor-stretch.svg'
  },
  {
    id: 'prayer-stretch',
    name: 'Prayer Stretch',
    targetArea: 'wrists',
    description: 'Stretches the wrist flexors bilaterally and gently loads the carpal tunnel structures.',
    cues: [
      'Press your palms together in front of your chest at heart height',
      'Slowly lower your hands toward your waist while keeping palms together',
      'Stop when you feel a stretch in your wrists and forearms; hold 20 to 30 seconds'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'prayer-stretch.svg'
  },
  {
    id: 'forearm-supination',
    name: 'Forearm Supination and Pronation',
    targetArea: 'wrists',
    description: 'Restores forearm rotation mobility that becomes restricted from sustained keyboard posture.',
    cues: [
      'Hold your elbow at 90 degrees at your side, upper arm against your ribcage',
      'Rotate your palm slowly all the way up, then all the way down',
      'Keep the upper arm still; the movement comes from the forearm, not the shoulder'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'forearm-supination.svg'
  },
  {
    id: 'wrist-circles',
    name: 'Wrist Circles',
    targetArea: 'wrists',
    description: 'Maintains full wrist mobility and lubricates the joint after sustained static gripping.',
    cues: [
      'Extend both arms forward, hands loosely fisted',
      'Draw slow, large circles with both wrists simultaneously, 10 each direction',
      'Move through the full range; light cracking is normal'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wrist-circles.svg'
  }
];
