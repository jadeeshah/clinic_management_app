/**
 * ICD-10 Codes commonly used in Physical Therapy
 * Focused subset of ~300 codes relevant to PT practice
 */

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export const icd10Codes: ICD10Code[] = [
  // Cervical Spine (M54.2)
  { code: 'M54.2', description: 'Cervicalgia (Neck Pain)', category: 'Spine' },
  { code: 'M50.10', description: 'Cervical disc disorder with radiculopathy, unspecified cervical region', category: 'Spine' },
  { code: 'M50.11', description: 'Cervical disc disorder with radiculopathy, high cervical region', category: 'Spine' },
  { code: 'M50.12', description: 'Cervical disc disorder with radiculopathy, mid-cervical region', category: 'Spine' },
  { code: 'M50.13', description: 'Cervical disc disorder with radiculopathy, cervicothoracic region', category: 'Spine' },
  { code: 'M50.20', description: 'Other cervical disc displacement, unspecified cervical region', category: 'Spine' },
  { code: 'M53.0', description: 'Cervicocranial syndrome', category: 'Spine' },
  { code: 'M53.1', description: 'Cervicobrachial syndrome', category: 'Spine' },

  // Thoracic Spine
  { code: 'M54.6', description: 'Pain in thoracic spine', category: 'Spine' },
  { code: 'M51.14', description: 'Intervertebral disc disorders with radiculopathy, thoracic region', category: 'Spine' },
  { code: 'M51.24', description: 'Other intervertebral disc displacement, thoracic region', category: 'Spine' },

  // Low Back Pain
  { code: 'M54.5', description: 'Low back pain (Lumbago)', category: 'Spine' },
  { code: 'M54.50', description: 'Low back pain, unspecified', category: 'Spine' },
  { code: 'M54.51', description: 'Vertebrogenic low back pain', category: 'Spine' },
  { code: 'M54.59', description: 'Other low back pain', category: 'Spine' },
  { code: 'M54.4', description: 'Lumbago with sciatica', category: 'Spine' },
  { code: 'M54.40', description: 'Lumbago with sciatica, unspecified side', category: 'Spine' },
  { code: 'M54.41', description: 'Lumbago with sciatica, right side', category: 'Spine' },
  { code: 'M54.42', description: 'Lumbago with sciatica, left side', category: 'Spine' },
  { code: 'M51.16', description: 'Intervertebral disc disorders with radiculopathy, lumbar region', category: 'Spine' },
  { code: 'M51.17', description: 'Intervertebral disc disorders with radiculopathy, lumbosacral region', category: 'Spine' },
  { code: 'M51.26', description: 'Other intervertebral disc displacement, lumbar region', category: 'Spine' },
  { code: 'M51.27', description: 'Other intervertebral disc displacement, lumbosacral region', category: 'Spine' },
  { code: 'M47.816', description: 'Spondylosis without myelopathy or radiculopathy, lumbar region', category: 'Spine' },
  { code: 'M47.817', description: 'Spondylosis without myelopathy or radiculopathy, lumbosacral region', category: 'Spine' },
  { code: 'M48.06', description: 'Spinal stenosis, lumbar region', category: 'Spine' },
  { code: 'M48.07', description: 'Spinal stenosis, lumbosacral region', category: 'Spine' },

  // Sacroiliac & Pelvis
  { code: 'M53.3', description: 'Sacrococcygeal disorders, not elsewhere classified', category: 'Spine' },
  { code: 'M46.1', description: 'Sacroiliitis, not elsewhere classified', category: 'Spine' },
  { code: 'M54.3', description: 'Sciatica', category: 'Spine' },

  // Shoulder
  { code: 'M25.511', description: 'Pain in right shoulder', category: 'Shoulder' },
  { code: 'M25.512', description: 'Pain in left shoulder', category: 'Shoulder' },
  { code: 'M25.519', description: 'Pain in unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.00', description: 'Adhesive capsulitis of unspecified shoulder (Frozen Shoulder)', category: 'Shoulder' },
  { code: 'M75.01', description: 'Adhesive capsulitis of right shoulder', category: 'Shoulder' },
  { code: 'M75.02', description: 'Adhesive capsulitis of left shoulder', category: 'Shoulder' },
  { code: 'M75.10', description: 'Rotator cuff tear or rupture, unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.100', description: 'Unspecified rotator cuff tear or rupture, unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.101', description: 'Unspecified rotator cuff tear or rupture, right shoulder', category: 'Shoulder' },
  { code: 'M75.102', description: 'Unspecified rotator cuff tear or rupture, left shoulder', category: 'Shoulder' },
  { code: 'M75.110', description: 'Incomplete rotator cuff tear, unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.111', description: 'Incomplete rotator cuff tear, right shoulder', category: 'Shoulder' },
  { code: 'M75.112', description: 'Incomplete rotator cuff tear, left shoulder', category: 'Shoulder' },
  { code: 'M75.120', description: 'Complete rotator cuff tear, unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.121', description: 'Complete rotator cuff tear, right shoulder', category: 'Shoulder' },
  { code: 'M75.122', description: 'Complete rotator cuff tear, left shoulder', category: 'Shoulder' },
  { code: 'M75.20', description: 'Bicipital tendinitis, unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.21', description: 'Bicipital tendinitis, right shoulder', category: 'Shoulder' },
  { code: 'M75.22', description: 'Bicipital tendinitis, left shoulder', category: 'Shoulder' },
  { code: 'M75.30', description: 'Calcific tendinitis of unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.40', description: 'Impingement syndrome of unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.41', description: 'Impingement syndrome of right shoulder', category: 'Shoulder' },
  { code: 'M75.42', description: 'Impingement syndrome of left shoulder', category: 'Shoulder' },
  { code: 'M75.50', description: 'Bursitis of unspecified shoulder', category: 'Shoulder' },
  { code: 'M75.51', description: 'Bursitis of right shoulder', category: 'Shoulder' },
  { code: 'M75.52', description: 'Bursitis of left shoulder', category: 'Shoulder' },
  { code: 'S43.401A', description: 'Unspecified sprain of right shoulder joint, initial encounter', category: 'Shoulder' },
  { code: 'S43.402A', description: 'Unspecified sprain of left shoulder joint, initial encounter', category: 'Shoulder' },

  // Elbow
  { code: 'M25.521', description: 'Pain in right elbow', category: 'Elbow' },
  { code: 'M25.522', description: 'Pain in left elbow', category: 'Elbow' },
  { code: 'M25.529', description: 'Pain in unspecified elbow', category: 'Elbow' },
  { code: 'M77.10', description: 'Lateral epicondylitis, unspecified elbow (Tennis Elbow)', category: 'Elbow' },
  { code: 'M77.11', description: 'Lateral epicondylitis, right elbow', category: 'Elbow' },
  { code: 'M77.12', description: 'Lateral epicondylitis, left elbow', category: 'Elbow' },
  { code: 'M77.00', description: 'Medial epicondylitis, unspecified elbow (Golfer\'s Elbow)', category: 'Elbow' },
  { code: 'M77.01', description: 'Medial epicondylitis, right elbow', category: 'Elbow' },
  { code: 'M77.02', description: 'Medial epicondylitis, left elbow', category: 'Elbow' },
  { code: 'M70.20', description: 'Olecranon bursitis, unspecified elbow', category: 'Elbow' },
  { code: 'M70.21', description: 'Olecranon bursitis, right elbow', category: 'Elbow' },
  { code: 'M70.22', description: 'Olecranon bursitis, left elbow', category: 'Elbow' },

  // Wrist & Hand
  { code: 'M25.531', description: 'Pain in right wrist', category: 'Wrist/Hand' },
  { code: 'M25.532', description: 'Pain in left wrist', category: 'Wrist/Hand' },
  { code: 'M25.539', description: 'Pain in unspecified wrist', category: 'Wrist/Hand' },
  { code: 'G56.00', description: 'Carpal tunnel syndrome, unspecified upper limb', category: 'Wrist/Hand' },
  { code: 'G56.01', description: 'Carpal tunnel syndrome, right upper limb', category: 'Wrist/Hand' },
  { code: 'G56.02', description: 'Carpal tunnel syndrome, left upper limb', category: 'Wrist/Hand' },
  { code: 'M65.30', description: 'Trigger finger, unspecified finger', category: 'Wrist/Hand' },
  { code: 'M65.4', description: 'Radial styloid tenosynovitis (de Quervain)', category: 'Wrist/Hand' },
  { code: 'M79.641', description: 'Pain in right hand', category: 'Wrist/Hand' },
  { code: 'M79.642', description: 'Pain in left hand', category: 'Wrist/Hand' },
  { code: 'M79.644', description: 'Pain in right finger(s)', category: 'Wrist/Hand' },
  { code: 'M79.645', description: 'Pain in left finger(s)', category: 'Wrist/Hand' },

  // Hip
  { code: 'M25.551', description: 'Pain in right hip', category: 'Hip' },
  { code: 'M25.552', description: 'Pain in left hip', category: 'Hip' },
  { code: 'M25.559', description: 'Pain in unspecified hip', category: 'Hip' },
  { code: 'M16.11', description: 'Unilateral primary osteoarthritis, right hip', category: 'Hip' },
  { code: 'M16.12', description: 'Unilateral primary osteoarthritis, left hip', category: 'Hip' },
  { code: 'M70.60', description: 'Trochanteric bursitis, unspecified hip', category: 'Hip' },
  { code: 'M70.61', description: 'Trochanteric bursitis, right hip', category: 'Hip' },
  { code: 'M70.62', description: 'Trochanteric bursitis, left hip', category: 'Hip' },
  { code: 'M76.00', description: 'Gluteal tendinitis, unspecified hip', category: 'Hip' },
  { code: 'M76.01', description: 'Gluteal tendinitis, right hip', category: 'Hip' },
  { code: 'M76.02', description: 'Gluteal tendinitis, left hip', category: 'Hip' },
  { code: 'Z96.641', description: 'Presence of right artificial hip joint', category: 'Hip' },
  { code: 'Z96.642', description: 'Presence of left artificial hip joint', category: 'Hip' },

  // Knee
  { code: 'M25.561', description: 'Pain in right knee', category: 'Knee' },
  { code: 'M25.562', description: 'Pain in left knee', category: 'Knee' },
  { code: 'M25.569', description: 'Pain in unspecified knee', category: 'Knee' },
  { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee', category: 'Knee' },
  { code: 'M17.12', description: 'Unilateral primary osteoarthritis, left knee', category: 'Knee' },
  { code: 'M17.0', description: 'Bilateral primary osteoarthritis of knee', category: 'Knee' },
  { code: 'M22.40', description: 'Chondromalacia patellae, unspecified knee', category: 'Knee' },
  { code: 'M22.41', description: 'Chondromalacia patellae, right knee', category: 'Knee' },
  { code: 'M22.42', description: 'Chondromalacia patellae, left knee', category: 'Knee' },
  { code: 'M23.50', description: 'Chronic instability of knee, unspecified knee', category: 'Knee' },
  { code: 'M23.51', description: 'Chronic instability of knee, right knee', category: 'Knee' },
  { code: 'M23.52', description: 'Chronic instability of knee, left knee', category: 'Knee' },
  { code: 'M23.200', description: 'Derangement of unspecified meniscus, right knee', category: 'Knee' },
  { code: 'M23.201', description: 'Derangement of unspecified meniscus, left knee', category: 'Knee' },
  { code: 'M76.50', description: 'Patellar tendinitis, unspecified knee', category: 'Knee' },
  { code: 'M76.51', description: 'Patellar tendinitis, right knee', category: 'Knee' },
  { code: 'M76.52', description: 'Patellar tendinitis, left knee', category: 'Knee' },
  { code: 'M70.40', description: 'Prepatellar bursitis, unspecified knee', category: 'Knee' },
  { code: 'M70.41', description: 'Prepatellar bursitis, right knee', category: 'Knee' },
  { code: 'M70.42', description: 'Prepatellar bursitis, left knee', category: 'Knee' },
  { code: 'S83.511A', description: 'Sprain of anterior cruciate ligament of right knee, initial encounter', category: 'Knee' },
  { code: 'S83.512A', description: 'Sprain of anterior cruciate ligament of left knee, initial encounter', category: 'Knee' },
  { code: 'S83.401A', description: 'Sprain of unspecified collateral ligament of right knee, initial encounter', category: 'Knee' },
  { code: 'S83.402A', description: 'Sprain of unspecified collateral ligament of left knee, initial encounter', category: 'Knee' },
  { code: 'Z96.651', description: 'Presence of right artificial knee joint', category: 'Knee' },
  { code: 'Z96.652', description: 'Presence of left artificial knee joint', category: 'Knee' },

  // Ankle & Foot
  { code: 'M25.571', description: 'Pain in right ankle and joints of right foot', category: 'Ankle/Foot' },
  { code: 'M25.572', description: 'Pain in left ankle and joints of left foot', category: 'Ankle/Foot' },
  { code: 'M25.579', description: 'Pain in unspecified ankle and joints of unspecified foot', category: 'Ankle/Foot' },
  { code: 'M77.30', description: 'Calcaneal spur, unspecified foot', category: 'Ankle/Foot' },
  { code: 'M77.31', description: 'Calcaneal spur, right foot', category: 'Ankle/Foot' },
  { code: 'M77.32', description: 'Calcaneal spur, left foot', category: 'Ankle/Foot' },
  { code: 'M72.2', description: 'Plantar fasciitis', category: 'Ankle/Foot' },
  { code: 'M76.60', description: 'Achilles tendinitis, unspecified leg', category: 'Ankle/Foot' },
  { code: 'M76.61', description: 'Achilles tendinitis, right leg', category: 'Ankle/Foot' },
  { code: 'M76.62', description: 'Achilles tendinitis, left leg', category: 'Ankle/Foot' },
  { code: 'M76.70', description: 'Peroneal tendinitis, unspecified leg', category: 'Ankle/Foot' },
  { code: 'M76.71', description: 'Peroneal tendinitis, right leg', category: 'Ankle/Foot' },
  { code: 'M76.72', description: 'Peroneal tendinitis, left leg', category: 'Ankle/Foot' },
  { code: 'S93.401A', description: 'Sprain of unspecified ligament of right ankle, initial encounter', category: 'Ankle/Foot' },
  { code: 'S93.402A', description: 'Sprain of unspecified ligament of left ankle, initial encounter', category: 'Ankle/Foot' },
  { code: 'M21.371', description: 'Foot drop, right foot', category: 'Ankle/Foot' },
  { code: 'M21.372', description: 'Foot drop, left foot', category: 'Ankle/Foot' },

  // Muscle/Soft Tissue
  { code: 'M62.830', description: 'Muscle spasm of back', category: 'Muscle' },
  { code: 'M62.831', description: 'Muscle spasm of calf', category: 'Muscle' },
  { code: 'M62.838', description: 'Other muscle spasm', category: 'Muscle' },
  { code: 'M79.1', description: 'Myalgia', category: 'Muscle' },
  { code: 'M79.10', description: 'Myalgia, unspecified site', category: 'Muscle' },
  { code: 'M79.11', description: 'Myalgia of mastication muscle', category: 'Muscle' },
  { code: 'M79.12', description: 'Myalgia of auxiliary muscles, head and neck', category: 'Muscle' },
  { code: 'M79.18', description: 'Myalgia, other site', category: 'Muscle' },
  { code: 'M60.9', description: 'Myositis, unspecified', category: 'Muscle' },
  { code: 'M79.3', description: 'Panniculitis, unspecified', category: 'Muscle' },

  // Neurological
  { code: 'G62.9', description: 'Polyneuropathy, unspecified', category: 'Neurological' },
  { code: 'G57.00', description: 'Lesion of sciatic nerve, unspecified lower limb', category: 'Neurological' },
  { code: 'G57.01', description: 'Lesion of sciatic nerve, right lower limb', category: 'Neurological' },
  { code: 'G57.02', description: 'Lesion of sciatic nerve, left lower limb', category: 'Neurological' },
  { code: 'G56.10', description: 'Other lesions of median nerve, unspecified upper limb', category: 'Neurological' },
  { code: 'G56.20', description: 'Lesion of ulnar nerve, unspecified upper limb', category: 'Neurological' },
  { code: 'G56.30', description: 'Lesion of radial nerve, unspecified upper limb', category: 'Neurological' },
  { code: 'G54.0', description: 'Brachial plexus disorders', category: 'Neurological' },
  { code: 'G54.1', description: 'Lumbosacral plexus disorders', category: 'Neurological' },
  { code: 'R26.0', description: 'Ataxic gait', category: 'Neurological' },
  { code: 'R26.1', description: 'Paralytic gait', category: 'Neurological' },
  { code: 'R26.2', description: 'Difficulty in walking, not elsewhere classified', category: 'Neurological' },
  { code: 'R26.81', description: 'Unsteadiness on feet', category: 'Neurological' },
  { code: 'R26.89', description: 'Other abnormalities of gait and mobility', category: 'Neurological' },
  { code: 'R26.9', description: 'Unspecified abnormalities of gait and mobility', category: 'Neurological' },
  { code: 'R27.0', description: 'Ataxia, unspecified', category: 'Neurological' },
  { code: 'R27.8', description: 'Other lack of coordination', category: 'Neurological' },
  { code: 'R27.9', description: 'Unspecified lack of coordination', category: 'Neurological' },
  { code: 'G81.90', description: 'Hemiplegia, unspecified affecting unspecified side', category: 'Neurological' },
  { code: 'G81.91', description: 'Hemiplegia, unspecified affecting right dominant side', category: 'Neurological' },
  { code: 'G81.92', description: 'Hemiplegia, unspecified affecting left dominant side', category: 'Neurological' },
  { code: 'G82.20', description: 'Paraplegia, unspecified', category: 'Neurological' },
  { code: 'G82.50', description: 'Quadriplegia, unspecified', category: 'Neurological' },

  // Balance & Vestibular
  { code: 'R42', description: 'Dizziness and giddiness', category: 'Vestibular' },
  { code: 'H81.10', description: 'Benign paroxysmal vertigo, unspecified ear', category: 'Vestibular' },
  { code: 'H81.11', description: 'Benign paroxysmal vertigo, right ear', category: 'Vestibular' },
  { code: 'H81.12', description: 'Benign paroxysmal vertigo, left ear', category: 'Vestibular' },
  { code: 'H81.13', description: 'Benign paroxysmal vertigo, bilateral', category: 'Vestibular' },
  { code: 'H81.49', description: 'Vertigo of central origin, unspecified ear', category: 'Vestibular' },
  { code: 'R29.6', description: 'Repeated falls', category: 'Vestibular' },

  // Post-Surgical / Rehab
  { code: 'Z87.39', description: 'Personal history of other musculoskeletal disorders', category: 'Post-Surgical' },
  { code: 'Z96.60', description: 'Presence of orthopedic joint implant, unspecified', category: 'Post-Surgical' },
  { code: 'Z98.1', description: 'Arthrodesis status', category: 'Post-Surgical' },
  { code: 'M96.1', description: 'Postlaminectomy syndrome, not elsewhere classified', category: 'Post-Surgical' },
  { code: 'T84.84XA', description: 'Pain due to internal orthopedic prosthetic devices, implants and grafts, initial encounter', category: 'Post-Surgical' },
  { code: 'Z47.1', description: 'Aftercare following joint replacement surgery', category: 'Post-Surgical' },
  { code: 'Z47.89', description: 'Encounter for other orthopedic aftercare', category: 'Post-Surgical' },
  { code: 'Z51.89', description: 'Encounter for other specified aftercare', category: 'Post-Surgical' },

  // General / Other
  { code: 'M79.89', description: 'Other specified soft tissue disorders', category: 'General' },
  { code: 'M79.9', description: 'Soft tissue disorder, unspecified', category: 'General' },
  { code: 'R29.3', description: 'Abnormal posture', category: 'General' },
  { code: 'M62.81', description: 'Muscle weakness (generalized)', category: 'General' },
  { code: 'R53.1', description: 'Weakness', category: 'General' },
  { code: 'R53.81', description: 'Other malaise', category: 'General' },
  { code: 'R53.83', description: 'Other fatigue', category: 'General' },
  { code: 'M62.50', description: 'Muscle wasting and atrophy, not elsewhere classified, unspecified site', category: 'General' },
  { code: 'G25.3', description: 'Myoclonus', category: 'General' },
  { code: 'M62.40', description: 'Contracture of muscle, unspecified site', category: 'General' },
  { code: 'M24.50', description: 'Contracture, unspecified joint', category: 'General' },
  { code: 'M25.60', description: 'Stiffness of unspecified joint, not elsewhere classified', category: 'General' },
  { code: 'R29.898', description: 'Other symptoms and signs involving the musculoskeletal system', category: 'General' },
  { code: 'M25.50', description: 'Pain in unspecified joint', category: 'General' },

  // Fibromyalgia & Chronic Pain
  { code: 'M79.7', description: 'Fibromyalgia', category: 'Chronic Pain' },
  { code: 'G89.29', description: 'Other chronic pain', category: 'Chronic Pain' },
  { code: 'G89.4', description: 'Chronic pain syndrome', category: 'Chronic Pain' },
  { code: 'R52', description: 'Pain, unspecified', category: 'Chronic Pain' },

  // Arthritis
  { code: 'M06.9', description: 'Rheumatoid arthritis, unspecified', category: 'Arthritis' },
  { code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site', category: 'Arthritis' },
  { code: 'M15.0', description: 'Primary generalized (osteo)arthritis', category: 'Arthritis' },
  { code: 'M45.9', description: 'Ankylosing spondylitis of unspecified sites in spine', category: 'Arthritis' },

  // TMJ
  { code: 'M26.60', description: 'Temporomandibular joint disorder, unspecified', category: 'TMJ' },
  { code: 'M26.62', description: 'Arthralgia of temporomandibular joint', category: 'TMJ' },
  { code: 'M26.63', description: 'Articular disc disorder of temporomandibular joint', category: 'TMJ' },

  // Headache
  { code: 'G44.209', description: 'Tension-type headache, unspecified, not intractable', category: 'Headache' },
  { code: 'G44.221', description: 'Chronic tension-type headache, intractable', category: 'Headache' },
  { code: 'M53.0', description: 'Cervicocranial syndrome', category: 'Headache' },
  { code: 'R51.9', description: 'Headache, unspecified', category: 'Headache' },

  // Stroke
  { code: 'I63.9', description: 'Cerebral infarction, unspecified', category: 'Stroke' },
  { code: 'I69.30', description: 'Unspecified sequelae of cerebral infarction', category: 'Stroke' },
  { code: 'I69.31', description: 'Cognitive deficits following cerebral infarction', category: 'Stroke' },
  { code: 'I69.32', description: 'Speech and language deficits following cerebral infarction', category: 'Stroke' },
  { code: 'I69.33', description: 'Monoplegia of upper limb following cerebral infarction', category: 'Stroke' },
  { code: 'I69.34', description: 'Monoplegia of lower limb following cerebral infarction', category: 'Stroke' },
  { code: 'I69.35', description: 'Hemiplegia and hemiparesis following cerebral infarction', category: 'Stroke' },
  { code: 'I69.36', description: 'Other paralytic syndrome following cerebral infarction', category: 'Stroke' },
  { code: 'I69.391', description: 'Dysphagia following cerebral infarction', category: 'Stroke' },
  { code: 'I69.398', description: 'Other sequelae of cerebral infarction', category: 'Stroke' },

  // Parkinson's
  { code: 'G20', description: 'Parkinson\'s disease', category: 'Neurological' },
  { code: 'G21.9', description: 'Secondary parkinsonism, unspecified', category: 'Neurological' },

  // Multiple Sclerosis
  { code: 'G35', description: 'Multiple sclerosis', category: 'Neurological' },

  // Sports/Overuse Injuries
  { code: 'M76.10', description: 'Psoas tendinitis, unspecified hip', category: 'Hip' },
  { code: 'M76.11', description: 'Psoas tendinitis, right hip', category: 'Hip' },
  { code: 'M76.12', description: 'Psoas tendinitis, left hip', category: 'Hip' },
  { code: 'M76.30', description: 'Iliotibial band syndrome, unspecified leg', category: 'Knee' },
  { code: 'M76.31', description: 'Iliotibial band syndrome, right leg', category: 'Knee' },
  { code: 'M76.32', description: 'Iliotibial band syndrome, left leg', category: 'Knee' },
  { code: 'M76.40', description: 'Tibial collateral bursitis [Pellegrini-Stieda], unspecified leg', category: 'Knee' },
  { code: 'M76.81', description: 'Anterior tibial syndrome', category: 'Ankle/Foot' },
  { code: 'M76.82', description: 'Posterior tibial tendinitis', category: 'Ankle/Foot' },
  { code: 'M76.891', description: 'Other specified enthesopathies of right lower limb, excluding foot', category: 'General' },
  { code: 'M76.892', description: 'Other specified enthesopathies of left lower limb, excluding foot', category: 'General' },
];

/**
 * Search ICD-10 codes by code or description
 */
export const searchICD10Codes = (query: string): ICD10Code[] => {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  return icd10Codes.filter(
    (code) =>
      code.code.toLowerCase().includes(normalizedQuery) ||
      code.description.toLowerCase().includes(normalizedQuery) ||
      code.category.toLowerCase().includes(normalizedQuery)
  ).slice(0, 20); // Limit results
};

/**
 * Get unique categories
 */
export const getICD10Categories = (): string[] => {
  return [...new Set(icd10Codes.map((c) => c.category))].sort();
};

/**
 * Get codes by category
 */
export const getCodesByCategory = (category: string): ICD10Code[] => {
  return icd10Codes.filter((c) => c.category === category);
};
