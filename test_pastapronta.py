import tempfile
import unittest
from pathlib import Path
from pastapronta import plan, apply, undo

class PastaProntaTests(unittest.TestCase):
    def test_preview_apply_undo(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "b.txt").write_text("B")
            (folder / "a.txt").write_text("A")
            pairs = plan(folder, "doc", ".txt")
            self.assertEqual(len(pairs), 2)
            self.assertTrue((folder / "a.txt").exists())
            apply(folder, pairs)
            self.assertEqual((folder / "doc_001.txt").read_text(), "A")
            self.assertEqual((folder / "doc_002.txt").read_text(), "B")
            undo(folder)
            self.assertEqual((folder / "a.txt").read_text(), "A")
            self.assertEqual((folder / "b.txt").read_text(), "B")

    def test_reject_existing_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "a.txt").write_text("A")
            (folder / "doc_001.txt").write_text("already")
            with self.assertRaises(ValueError):
                plan(folder, "doc", ".txt")

if __name__ == "__main__":
    unittest.main()
