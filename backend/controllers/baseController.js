import { HttpError } from '../middleware/errors.js';
import { id, validate } from '../middleware/validation.js';
export function createController(resource, model) {
 const found = row => { if (!row) throw new HttpError(404,'Record not found.'); return row; };
 return {
 async list(req,res) { const q = req.query.q ?? ''; if (typeof q !== 'string' || q.length > 200) throw new HttpError(400,'Search must be text of at most 200 characters.'); res.json({success:true,data:await model.list(q.trim())}); },
 async find(req,res) { res.json({success:true,data:found(await model.find(id(req.params.id)))}); },
 async create(req,res) { res.status(201).json({success:true,data:await model.create(validate(resource,req.body))}); },
 async update(req,res) { res.json({success:true,data:found(await model.update(id(req.params.id),validate(resource,req.body)))}); },
 async remove(req,res) { found(await model.remove(id(req.params.id))); res.status(204).end(); }
 };
}
