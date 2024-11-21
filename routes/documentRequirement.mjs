const express = require("express");
const router = express.Router();
const Document = require('../schema/documentRequirements.js');  // Assuming you have the Document schema defined in 'documentRequirements.js'

// GET - Retrieve all documents
router.get("/documents", async (req, res) => {
  try {
    const documents = await Document.find(); // Fetch all documents from the DB
    res.status(200).json({ status: "ok", data: documents });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ status: "error", message: "Server Error" });
  }
});

// POST - Create a new document
router.post("/add-document", async (req, res) => {
  try {
    const { documentName } = req.body;  // Extract document name from request body

    if (!documentName) {
      return res.status(400).json({ status: "error", message: "Document name is required" });
    }

    const newDocument = new Document({
      documentName,
    });

    await newDocument.save();  // Save the new document in the DB
    res.status(201).json({ status: "ok", data: newDocument });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ status: "error", message: "Error creating document" });
  }
});

// PUT - Update an existing document by its ID
router.put("/document/:id", async (req, res) => {
  try {
    const { documentName } = req.body;  // Extract the updated document name
    const documentId = req.params.id;  // Get the document ID from URL params

    if (!documentName) {
      return res.status(400).json({ status: "error", message: "Document name is required" });
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      { documentName },
      { new: true } // `new: true` ensures that the updated document is returned
    );

    if (!updatedDocument) {
      return res.status(404).json({ status: "error", message: "Document not found" });
    }

    res.status(200).json({ status: "ok", data: updatedDocument });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ status: "error", message: "Error updating document" });
  }
});

// DELETE - Delete a document by its ID
router.delete("/document/:id", async (req, res) => {
  try {
    const documentId = req.params.id;  // Get the document ID from URL params

    const deletedDocument = await Document.findByIdAndDelete(documentId);

    if (!deletedDocument) {
      return res.status(404).json({ status: "error", message: "Document not found" });
    }

    res.status(200).json({ status: "ok", message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ status: "error", message: "Error deleting document" });
  }
});

module.exports = router;
