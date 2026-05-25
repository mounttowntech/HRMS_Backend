const Client = require("../models/clientModel");

exports.createClient = async (req, res) => {
  try {
    const {
      industryTypeId,
      clientName,
      companyName,
      email,
      mobileNumber,
      address,
    } = req.body;

    const client = await Client.create({
      companyId: req.user.companyId,
      industryTypeId,
      clientName,
      companyName,
      email,
      mobileNumber,
      address,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({
      companyId: req.user.companyId,
    })
      .populate("industryTypeId", "name");

    res.status(200).json({
      success: true,
      clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("industryTypeId", "name");

    res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    await Client.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};