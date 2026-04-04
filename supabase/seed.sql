-- ============================================
-- Seed: Sample module with words and sentences
-- ============================================
-- Test data for development. Not production content.
-- Test user + learner are created by dev-auth.ts bootstrap at app startup.

insert into public.modules (id, title, description, display_order)
values (
  'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a',
  'Nature',
  'Words about nature and the outdoors',
  1
);

-- Word 1: river
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('d4e5f6a7-1b2c-4d3e-8f9a-0b1c2d3e4f5a', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'river', '川', 1);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('d4e5f6a7-1b2c-4d3e-8f9a-0b1c2d3e4f5a', 'I can see a river from my window.', '窓から川が見えます。', 1),
  ('d4e5f6a7-1b2c-4d3e-8f9a-0b1c2d3e4f5a', 'The river is very long.', 'その川はとても長いです。', 2);

-- Word 2: mountain
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('a7b8c9d0-2e3f-4a5b-9c6d-1e2f3a4b5c6d', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'mountain', '山', 2);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('a7b8c9d0-2e3f-4a5b-9c6d-1e2f3a4b5c6d', 'We climbed the mountain last summer.', '去年の夏、山に登りました。', 1),
  ('a7b8c9d0-2e3f-4a5b-9c6d-1e2f3a4b5c6d', 'The mountain is covered with snow.', '山は雪に覆われています。', 2);

-- Word 3: flower
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'flower', '花', 3);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'She gave me a beautiful flower.', '彼女は美しい花をくれました。', 1),
  ('c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'This flower smells very nice.', 'この花はとてもいい匂いがします。', 2);

-- Word 4: forest
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('e5f6a7b8-9c0d-4e1f-2a3b-4c5d6e7f8a9b', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'forest', '森', 4);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('e5f6a7b8-9c0d-4e1f-2a3b-4c5d6e7f8a9b', 'We went for a walk in the forest.', '森を散歩しました。', 1),
  ('e5f6a7b8-9c0d-4e1f-2a3b-4c5d6e7f8a9b', 'Many animals live in the forest.', '多くの動物が森に住んでいます。', 2);

-- Word 5: rain
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('f9a0b1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'rain', '雨', 5);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('f9a0b1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c', 'It will rain tomorrow.', '明日は雨が降るでしょう。', 1),
  ('f9a0b1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c', 'I forgot my umbrella in the rain.', '雨の中で傘を忘れました。', 2);

-- Word 6: wind
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'wind', '風', 6);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'The wind is very strong today.', '今日は風がとても強いです。', 1),
  ('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'The wind blew my hat away.', '風で帽子が飛ばされました。', 2);

-- Word 7: lake
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'lake', '湖', 7);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a', 'We swam in the lake.', '湖で泳ぎました。', 1),
  ('4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a', 'The lake is very deep.', 'その湖はとても深いです。', 2);

-- Word 8: cloud
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'cloud', '雲', 8);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'There are no clouds in the sky.', '空に雲がありません。', 1),
  ('6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'The cloud looks like a rabbit.', 'あの雲はうさぎのように見えます。', 2);

-- Word 9: star
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'star', '星', 9);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d', 'I can see many stars tonight.', '今夜はたくさんの星が見えます。', 1),
  ('8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d', 'That star is very bright.', 'あの星はとても明るいです。', 2);

-- Word 10: island
insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('0c1d2e3f-4a5b-4c6d-7e8f-9a0b1c2d3e4f', 'b3a1f2d4-7e89-4c56-a012-3f8b9d6e5c7a', 'island', '島', 10);

insert into public.sentences (word_id, text, meaning_ja, display_order) values
  ('0c1d2e3f-4a5b-4c6d-7e8f-9a0b1c2d3e4f', 'We visited a small island.', '小さな島を訪れました。', 1),
  ('0c1d2e3f-4a5b-4c6d-7e8f-9a0b1c2d3e4f', 'The island has a beautiful beach.', 'その島には美しいビーチがあります。', 2);
