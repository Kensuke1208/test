-- ============================================
-- Seed: Sample module with words and sentences
-- ============================================
-- Test data for development. Not production content.
-- Test user + learner are created by dev-auth.ts bootstrap at app startup.

insert into public.modules (id, title, description, display_order)
values (
  '00000000-0000-0000-0000-000000000001',
  'Nature',
  'Words about nature and the outdoors',
  1
);

-- Word 1: river
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'river', '川', 1);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000001', 'I can see a river from my window.', '窓から川が見えます。', 1),
  ('10000000-0000-0000-0000-000000000001', 'The river is very long.', 'その川はとても長いです。', 2);

-- Word 2: mountain
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'mountain', '山', 2);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000002', 'We climbed the mountain last summer.', '去年の夏、山に登りました。', 1),
  ('10000000-0000-0000-0000-000000000002', 'The mountain is covered with snow.', '山は雪に覆われています。', 2);

-- Word 3: flower
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'flower', '花', 3);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000003', 'She gave me a beautiful flower.', '彼女は美しい花をくれました。', 1),
  ('10000000-0000-0000-0000-000000000003', 'This flower smells very nice.', 'この花はとてもいい匂いがします。', 2);

-- Word 4: forest
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'forest', '森', 4);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000004', 'We went for a walk in the forest.', '森を散歩しました。', 1),
  ('10000000-0000-0000-0000-000000000004', 'Many animals live in the forest.', '多くの動物が森に住んでいます。', 2);

-- Word 5: rain
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'rain', '雨', 5);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000005', 'It will rain tomorrow.', '明日は雨が降るでしょう。', 1),
  ('10000000-0000-0000-0000-000000000005', 'I forgot my umbrella in the rain.', '雨の中で傘を忘れました。', 2);

-- Word 6: wind
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'wind', '風', 6);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000006', 'The wind is very strong today.', '今日は風がとても強いです。', 1),
  ('10000000-0000-0000-0000-000000000006', 'The wind blew my hat away.', '風で帽子が飛ばされました。', 2);

-- Word 7: lake
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'lake', '湖', 7);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000007', 'We swam in the lake.', '湖で泳ぎました。', 1),
  ('10000000-0000-0000-0000-000000000007', 'The lake is very deep.', 'その湖はとても深いです。', 2);

-- Word 8: cloud
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'cloud', '雲', 8);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000008', 'There are no clouds in the sky.', '空に雲がありません。', 1),
  ('10000000-0000-0000-0000-000000000008', 'The cloud looks like a rabbit.', 'あの雲はうさぎのように見えます。', 2);

-- Word 9: star
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'star', '星', 9);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000009', 'I can see many stars tonight.', '今夜はたくさんの星が見えます。', 1),
  ('10000000-0000-0000-0000-000000000009', 'That star is very bright.', 'あの星はとても明るいです。', 2);

-- Word 10: island
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'island', '島', 10);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('10000000-0000-0000-0000-000000000010', 'We visited a small island.', '小さな島を訪れました。', 1),
  ('10000000-0000-0000-0000-000000000010', 'The island has a beautiful beach.', 'その島には美しいビーチがあります。', 2);
